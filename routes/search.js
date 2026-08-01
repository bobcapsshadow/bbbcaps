import express from "express";

import { searchStocks } from "../services/searchService.js";

const router = express.Router();

router.get("/", async (req, res) => {

    try {

        const query = req.query.q || "";

        if (!query.trim()) {

            return res.status(400).json({
                success: false,
                message: "Search query is required."
            });

        }

        const stocks = await searchStocks(query);

        res.json({

            success: true,

            total: stocks.length,

            results: stocks

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: "Failed to search stocks."

        });

    }

});

export default router;