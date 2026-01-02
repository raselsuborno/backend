import prisma from '../lib/prisma.js';

const servicesController = {
  getAllServices: async (req, res, next) => {
    try {
      // TODO: Implement with Prisma
      // const services = await prisma.service.findMany();
      
      res.json({
        message: 'Get all services',
        // services
      });
    } catch (error) {
      next(error);
    }
  },

  getServiceById: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // TODO: Implement with Prisma
      // const service = await prisma.service.findUnique({
      //   where: { id: parseInt(id) }
      // });
      
      res.json({
        message: 'Get service by id',
        // service
      });
    } catch (error) {
      next(error);
    }
  }
};

export default servicesController;

