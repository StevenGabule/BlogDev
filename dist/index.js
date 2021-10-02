"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
// Middleware
const app = (0, express_1.default)();
// @ts-ignore
app.use(express_1.default.json());
// @ts-ignore
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cors_1.default)());
// @ts-ignore
app.use((0, morgan_1.default)('dev'));
app.use((0, cookie_parser_1.default)());
// Routes
app.get('/', (req, res) => {
    res.json({ msg: 'Welcome to the api' });
});
// Database
require("./config/database");
// server listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('Server is running on port', PORT);
});
