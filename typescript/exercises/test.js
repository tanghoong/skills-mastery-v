"use strict";
class Basket {
    items = [];
    add(item, quantity) {
        const existing = this.items.find(entry => entry.item === item);
        if (existing) {
            existing.quantity += quantity;
        }
        else {
            this.items.push({ item, quantity });
        }
    }
    remove(item) {
        const index = this.items.findIndex(entry => entry.item === item);
        if (index !== -1) {
            this.items.splice(index, 1);
        }
    }
    getItems() {
        return this.items;
    }
    total() {
        return this.items.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0);
    }
}
const apple = { name: "apple", color: "red", price: 10 };
const orange = { name: "orange", color: "orange", price: 20 };
const person = { name: "John", age: 30 };
const basket = new Basket();
basket.add({ name: "Durian", color: "green", price: 100 }, 1);
basket.add(apple, 2);
basket.add(orange, 4);
basket.add(apple, 3);
basket.add({ name: "banana", color: "yellow", price: 5 }, 6);
console.log(basket.getItems());
console.log(basket.total());
const itemSummary = basket.getItems()
    .map(entry => `${entry.quantity} ${entry.item.color} ${entry.item.name}(s)`)
    .join(" and ");
console.log(`${person.name} purchased ${itemSummary} and needs to pay a total of $${basket.total()}.`);
