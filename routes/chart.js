import express from "express";
import { getChart } from "../services/chartService.js";

const router = express.Router();

router.get("/:symbol", async (req, res) => {
    try {

        const { symbol } = req.params;
        const range = req.query.range || "1d";

        const data = await getChart(symbol, range);

        res.json({
            success: true,
            ...data
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
});

export default router;