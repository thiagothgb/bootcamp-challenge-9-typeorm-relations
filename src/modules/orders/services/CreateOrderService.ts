import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

interface ProductsOrder {
  price: number;
  quantity: number;
  product_id: string;
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('This customer_id is not valid');
    }

    const existsProducts = await this.productsRepository.findAllById(products);

    if (existsProducts.length === 0) {
      throw new AppError('Could not find any products with the giver ids');
    }

    if (existsProducts.length !== products.length) {
      throw new AppError('Exists invalid products on the list of products');
    }

    const finalProducts: ProductsOrder[] = [];

    products.map(product => {
      const productIndex = existsProducts.findIndex(
        item => (item.id = product.id),
      );

      if (productIndex >= 0) {
        const productFinded = existsProducts[productIndex];
        const quantity = productFinded.quantity - product.quantity;
        if (quantity < 0) {
          throw new AppError(
            `Product ${productFinded.name} does not have this available quantity`,
          );
        }

        finalProducts.push({
          price: productFinded.price,
          quantity: product.quantity,
          product_id: productFinded.id,
        });
      }
    });

    await this.productsRepository.updateQuantity(
      finalProducts.map(product => ({
        id: product.product_id,
        quantity: product.quantity,
      })),
    );

    const order = await this.ordersRepository.create({
      customer,
      products: finalProducts,
    });

    return order;
  }
}

export default CreateOrderService;
