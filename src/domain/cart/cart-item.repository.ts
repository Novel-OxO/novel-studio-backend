import { CartItem } from './cart-item';
import { NewCartItem } from './new-cart-item';

export const CART_ITEM_REPOSITORY = Symbol('CART_ITEM_REPOSITORY');

export interface ICartItemRepository {
  save(cartItem: NewCartItem): Promise<CartItem>;
  delete(userId: string, courseId: string): Promise<void>;
  findByUserAndCourse(userId: string, courseId: string): Promise<CartItem | null>;
  findAllByUserId(userId: string): Promise<CartItem[]>;
}
