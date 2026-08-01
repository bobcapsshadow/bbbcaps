import History from "../models/History.js";

/**
 * Get history of logged in user
 */
export const getHistory = async (userId) => {
  const history = await History.find({
    userId,
  })
    .sort({ createdAt: -1 })
    .lean();

  return history;
};