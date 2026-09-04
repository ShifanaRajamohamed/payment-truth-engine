import { Request, Response } from 'express';
import { VoiceService } from './voice.service';
import { ApiResponse } from '../../common/utils/api-response';

export class VoiceController {
  private voiceService = VoiceService.getInstance();

  speechToText = async (req: Request, res: Response) => {
    try {
      const { audioBase64, mimeType, languageCode } = req.body;
      const result = await this.voiceService.transcribe({
        audioBase64: audioBase64 || '',
        mimeType: mimeType || 'audio/wav',
        languageCode: languageCode || 'hi-IN'
      });
      return ApiResponse.success(res, result);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 'STT_FAILED', 500);
    }
  };

  textToSpeech = async (req: Request, res: Response) => {
    try {
      const { text, languageCode, gender, speed } = req.body;
      if (!text) {
        return ApiResponse.error(res, 'text is required for TTS', 'VALIDATION_ERROR', 400);
      }
      const result = await this.voiceService.synthesize({
        text,
        languageCode: languageCode || 'hi-IN',
        gender,
        speed
      });
      return ApiResponse.success(res, result);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 'TTS_FAILED', 500);
    }
  };
}
