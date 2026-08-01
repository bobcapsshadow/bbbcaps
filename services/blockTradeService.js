import fs from "fs";
import path from "path";
import BlockTrade from "../models/BlockTrade.js";

/*
|--------------------------------------------------------------------------
| Create Block Trade
|--------------------------------------------------------------------------
*/

export async function createBlockTrade(data, file) {

    const username = data.username?.trim().toLowerCase();

    if (!username) {
        throw new Error("Username is required.");
    }

    if (!data.companyName?.trim()) {
        throw new Error("Company name is required.");
    }

    if (!["BUY", "SELL"].includes(data.tradeType)) {
        throw new Error("Invalid trade type.");
    }

    const quantity = Number(data.quantity);
    const price = Number(data.price);

    if (Number.isNaN(quantity) || quantity <= 0) {
        throw new Error("Invalid quantity.");
    }

    if (Number.isNaN(price) || price <= 0) {
        throw new Error("Invalid price.");
    }

    const alreadyExists = await BlockTrade.findOne({
        username,
        companyName: data.companyName.trim(),
        tradeType: data.tradeType,
    });

    if (alreadyExists) {
        throw new Error("Block Trade already exists for this user.");
    }

    const value = quantity * price;

    const blockTrade = await BlockTrade.create({

        username,

        companyName: data.companyName.trim(),

        symbol: data.symbol || "",

        logo: file
            ? `/uploads/blocktrade/${file.filename}`
            : "",

        tradeType: data.tradeType,

        quantity,

        price,

        value,

    });

    return blockTrade;

}

/*
|--------------------------------------------------------------------------
| Get User Block Trades
|--------------------------------------------------------------------------
*/

export async function getUserBlockTrades(username) {

    if (!username) {
        throw new Error("Username is required.");
    }

    return await BlockTrade.find({
        username: username.toLowerCase(),
    }).sort({
        createdAt: -1,
    });

}

/*
|--------------------------------------------------------------------------
| Update Block Trade
|--------------------------------------------------------------------------
*/

export async function updateBlockTrade(id, data, file) {

    const blockTrade = await BlockTrade.findById(id);

    if (!blockTrade) {
        throw new Error("Block Trade not found.");
    }

    blockTrade.companyName =
        data.companyName?.trim() || blockTrade.companyName;

    blockTrade.symbol =
        data.symbol || "";

    blockTrade.tradeType =
        data.tradeType || blockTrade.tradeType;

    blockTrade.quantity =
        Number(data.quantity);

    blockTrade.price =
        Number(data.price);

    blockTrade.value =
        blockTrade.quantity * blockTrade.price;

    if (file) {

        if (blockTrade.logo) {

            const oldImage = path.join(
                process.cwd(),
                blockTrade.logo.replace(/^\//, "")
            );

            if (fs.existsSync(oldImage)) {
                fs.unlinkSync(oldImage);
            }

        }

        blockTrade.logo =
            `/uploads/blocktrade/${file.filename}`;

    }

    await blockTrade.save();

    return blockTrade;

}

/*
|--------------------------------------------------------------------------
| Delete Block Trade
|--------------------------------------------------------------------------
*/

export async function deleteBlockTrade(id) {

    const blockTrade = await BlockTrade.findById(id);

    if (!blockTrade) {
        throw new Error("Block Trade not found.");
    }

    if (blockTrade.logo) {

        const imagePath = path.join(
            process.cwd(),
            blockTrade.logo.replace(/^\//, "")
        );

        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

    }

    await blockTrade.deleteOne();

    return true;

}