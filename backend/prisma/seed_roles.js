"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
function seed() {
    return __awaiter(this, void 0, void 0, function* () {
        const password = yield bcrypt_1.default.hash('password123', 10);
        const users = [
            { email: 'admin@example.com', name: 'Admin User', role: 'ADMIN' },
            { email: 'sales@example.com', name: 'Sales Exec', role: 'SALES' },
            { email: 'warehouse@example.com', name: 'Warehouse Mgr', role: 'WAREHOUSE' },
            { email: 'accounts@example.com', name: 'Accounts Exec', role: 'ACCOUNTS' },
        ];
        for (const u of users) {
            yield prisma.user.upsert({
                where: { email: u.email },
                update: { role: u.role },
                create: Object.assign(Object.assign({}, u), { password })
            });
        }
        console.log('Roles seeded successfully!');
    });
}
seed().catch(console.error).finally(() => prisma.$disconnect());
