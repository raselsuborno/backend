import prisma from '../../lib/prisma.js';

const documentsController = {
  getMyDocuments: async (req, res, next) => {
    try {
      const workerProfileId = req.user.profile.id;

      const documents = await prisma.workerDocument.findMany({
        where: { workerProfileId },
        orderBy: { createdAt: 'desc' },
      });

      res.json(documents);
    } catch (error) {
      console.error('[Worker Documents] Error:', error);
      next(error);
    }
  },

  uploadDocument: async (req, res, next) => {
    try {
      const workerProfileId = req.user.profile.id;
      const { type, fileUrl } = req.body;

      const validTypes = ['WORK_AUTH', 'TAX', 'ID'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ 
          message: `Invalid document type. Must be one of: ${validTypes.join(', ')}` 
        });
      }

      if (!fileUrl) {
        return res.status(400).json({ message: 'File URL is required' });
      }

      const document = await prisma.workerDocument.create({
        data: {
          workerProfileId,
          type,
          fileUrl,
        },
      });

      res.status(201).json({
        message: 'Document uploaded successfully',
        document,
      });
    } catch (error) {
      console.error('[Worker Documents] Error:', error);
      next(error);
    }
  },

  deleteDocument: async (req, res, next) => {
    try {
      const { id } = req.params;
      const workerProfileId = req.user.profile.id;

      const document = await prisma.workerDocument.findUnique({
        where: { id },
      });

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      if (document.workerProfileId !== workerProfileId) {
        return res.status(403).json({ message: 'You can only delete your own documents' });
      }

      await prisma.workerDocument.delete({
        where: { id },
      });

      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      console.error('[Worker Documents] Error:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Document not found' });
      }
      next(error);
    }
  },
};

export default documentsController;
