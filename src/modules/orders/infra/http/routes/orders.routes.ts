import { Router } from 'express';
import { celebrate, Segments, Joi } from 'celebrate';
import OrdersController from '../controller/OrdersController';

const ordersRouter = Router();
const ordersController = new OrdersController();

ordersRouter.post(
  '/',
  celebrate({
    [Segments.BODY]: {
      customer_id: Joi.string().uuid().required(),
      products: Joi.array().items({
        id: Joi.string().uuid().required(),
        quantity: Joi.number().integer().positive(),
      }),
    },
  }),
  ordersController.create,
);

ordersRouter.get(
  '/:id',
  celebrate({
    [Segments.PARAMS]: {
      id: Joi.string().uuid().required(),
    },
  }),
  ordersController.show,
);

export default ordersRouter;
