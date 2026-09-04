import { Request, Response } from 'express';
import { LanguageRegistry } from '@deepaudit/language';
import { ApiResponse } from '../../common/utils/api-response';

export class LanguageController {
  getAll = (req: Request, res: Response) => {
    const languages = LanguageRegistry.getAll();
    return ApiResponse.success(res, languages);
  };

  getByCode = (req: Request, res: Response) => {
    const { code } = req.params;
    const language = LanguageRegistry.getByCode(code);
    return ApiResponse.success(res, language);
  };
}
