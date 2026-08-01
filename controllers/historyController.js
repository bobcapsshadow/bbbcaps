import * as historyService from "../services/historyService.js";

/**
 * GET /api/history
 * Logged-in user history
 */
export const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await historyService.getHistory(userId);

    return res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error("Get History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load history.",
    });
  }
};