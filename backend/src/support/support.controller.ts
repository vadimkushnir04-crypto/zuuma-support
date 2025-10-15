// backend/src/support/support.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SupportService } from './support.service';
import { AuthService } from '../auth/auth.service';
import {
  CreateManagerDto,
  SendMessageDto,
  AssignManagerDto,
  ResolveChatDto,
  ChatFilterDto,
  EscalateChatDto,
} from './dto/support.dto';

@Controller('support')
export class SupportController {
  constructor(
    private readonly supportService: SupportService,
    private readonly authService: AuthService,
  ) {}

  // ============================================
  // 📊 CHAT SESSIONS
  // ============================================

  @Get('chats')
  @UseGuards(JwtAuthGuard)
  async getChatSessions(@Query() filters: ChatFilterDto, @Request() req: any) {
    const user = await this.authService.getProfile(req.user.token || req.headers.authorization?.substring(7));
    
    return this.supportService.getChatSessions(filters, user.id);
  }

  @Get('chats/:sessionId')
  @UseGuards(JwtAuthGuard)
  async getChatSession(@Param('sessionId') sessionId: string) {
    const session = await this.supportService.getChatSession(sessionId);
    const messages = await this.supportService.getChatMessages(sessionId);

    return {
      success: true,
      session,
      messages,
    };
  }

  @Get('chats/:sessionId/messages')
  @UseGuards(JwtAuthGuard)
  async getChatMessages(@Param('sessionId') sessionId: string) {
    const messages = await this.supportService.getChatMessages(sessionId);

    return {
      success: true,
      messages,
    };
  }

  // ============================================
  // 🚨 ESCALATION
  // ============================================

  @Post('chats/:sessionId/escalate')
  async escalateChat(
    @Param('sessionId') sessionId: string,
    @Body() dto: EscalateChatDto,
  ) {
    const session = await this.supportService.escalateToHuman(
      sessionId,
      dto.reason,
      dto.urgency,
    );

    return {
      success: true,
      session,
      message: 'Chat escalated to human support',
    };
  }

  @Post('chats/assign')
  @UseGuards(JwtAuthGuard)
  async assignManager(@Body() dto: AssignManagerDto, @Request() req: any) {
    const session = await this.supportService.assignManager(
      dto.chatSessionId,
      dto.managerId,
    );

    return {
      success: true,
      session,
    };
  }

  @Post('chats/resolve')
  @UseGuards(JwtAuthGuard)
  async resolveChat(@Body() dto: ResolveChatDto, @Request() req: any) {
    const session = await this.supportService.resolveChat(
      dto.chatSessionId,
      req.user.id,
    );

    return {
      success: true,
      session,
    };
  }

  // ============================================
  // 💬 MESSAGES
  // ============================================

  @Post('chats/:sessionId/message')
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendMessageDto,
    @Request() req: any,
  ) {
    const senderId = req.user?.id;
    const message = await this.supportService.sendManagerMessage(sessionId, dto.content, senderId);
    return { success: true, message };
  }

  // ============================================
  // 👥 MANAGERS
  // ============================================

  @Post('managers')
  @UseGuards(JwtAuthGuard)
  async createManager(@Body() dto: CreateManagerDto, @Request() req: any) {
    const user = await this.authService.getProfile(req.user.token || req.headers.authorization?.substring(7));
    
    const manager = await this.supportService.createManager(
      dto,
      req.user.id,
      user.id,
    );

    return {
      success: true,
      manager: {
        id: manager.id,
        email: manager.email,
        name: manager.name,
        role: manager.role,
      },
    };
  }

  @Get('managers')
  @UseGuards(JwtAuthGuard)
  async getManagers(@Request() req: any) {
    const user = await this.authService.getProfile(req.user.token || req.headers.authorization?.substring(7));
    
    const managers = await this.supportService.getManagersByCompany(user.id);

    return {
      success: true,
      managers: managers.map((m) => ({
        id: m.id,
        email: m.email,
        name: m.name,
        role: m.role,
        active: m.active,
        lastLoginAt: m.lastLoginAt,
      })),
    };
  }

  @Put('managers/:managerId/deactivate')
  @UseGuards(JwtAuthGuard)
  async deactivateManager(@Param('managerId') managerId: string) {
    await this.supportService.deactivateManager(managerId);

    return {
      success: true,
      message: 'Manager deactivated',
    };
  }

  // ============================================
  // 📈 STATS
  // ============================================

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@Request() req: any) {
    const user = await this.authService.getProfile(req.user.token || req.headers.authorization?.substring(7));
    
    const pending = await this.supportService.getChatSessions(
      { status: 'pending_human', limit: 1000 },
      user.id,
    );
    
    const active = await this.supportService.getChatSessions(
      { status: 'human_active', limit: 1000 },
      user.id,
    );

    return {
      success: true,
      stats: {
        pendingChats: pending.total,
        activeChats: active.total,
      },
    };
  }

  // ===============================
  // 💬 Отправка сообщения менеджера
  // ===============================
  @Post('chats/:sessionId/message-manager')
  @UseGuards(JwtAuthGuard)
  async sendManagerMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendMessageDto,
    @Request() req: any
  ) {
    const managerId = req.user.id;
    console.log('📨 Sending manager message:', { sessionId, content: dto.content, managerId });

    const message = await this.supportService.sendManagerMessage(sessionId, dto.content, managerId);

    return {
      success: true,
      message,
    };
  }

  @Post('chats/:sessionId/return-to-ai')
  @UseGuards(JwtAuthGuard)
  async returnChatToAi(
    @Param('sessionId') sessionId: string,
    @Body() body: { message?: string },
    @Request() req: any,
  ) {
    try {
      const session = await this.supportService.returnToAi(
        sessionId,
        body.message
      );

      return {
        success: true,
        session,
        message: 'Chat returned to AI successfully',
      };
    } catch (error) {
      console.error('Error returning chat to AI:', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to return chat to AI'
      );
    }
  }
}