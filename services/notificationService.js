import User from "../models/User.js";
import Notification from "../models/Notification.js";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizeUsername(username) {

    if (!username || typeof username !== "string" || !username.trim()) {
        throw new Error("Username is required.");
    }

    return username.trim().toLowerCase();

}

function validateTitle(title) {

    if (!title || typeof title !== "string" || !title.trim()) {
        throw new Error("Notification title is required.");
    }

    return title.trim();

}

function validateMessage(message) {

    if (!message || typeof message !== "string" || !message.trim()) {
        throw new Error("Notification message is required.");
    }

    return message.trim();

}

function validateType(type) {

    const allowedTypes = [
        "info",
        "success",
        "warning",
        "error",
    ];

    if (!type) {
        return "info";
    }

    const notificationType = type.toLowerCase().trim();

    if (!allowedTypes.includes(notificationType)) {
        throw new Error("Invalid notification type.");
    }

    return notificationType;

}

/*
|--------------------------------------------------------------------------
| Send Notification
|--------------------------------------------------------------------------
*/

export async function sendNotification(
    username,
    title,
    message,
    type = "info"
) {

    username = normalizeUsername(username);

    title = validateTitle(title);

    message = validateMessage(message);

    type = validateType(type);

    //----------------------------------
    // Find User
    //----------------------------------

    const user = await User.findOne({
        username,
    });

    if (!user) {
        throw new Error("User not found.");
    }

    //----------------------------------
    // Create Notification
    //----------------------------------

    const notification = await Notification.create({

        user: user._id,

        username: user.username,

        title,

        message,

        type,

    });

    //----------------------------------
    // Success Response
    //----------------------------------

    return {

        success: true,

        message: "Notification sent successfully.",

        notification,

    };

}

/*
|--------------------------------------------------------------------------
| Get User Notifications
|--------------------------------------------------------------------------
*/

export async function getNotifications(userId) {

    //----------------------------------
    // Find User
    //----------------------------------

    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found.");
    }

    //----------------------------------
    // Get Notifications
    //----------------------------------

    const notifications = await Notification.find({

        user: user._id,

    })
        .sort({
            createdAt: -1,
        });

    //----------------------------------
    // Unread Count
    //----------------------------------

    const unreadCount = notifications.filter(
        (notification) => !notification.isRead
    ).length;

    //----------------------------------
    // Success Response
    //----------------------------------

    return {

        success: true,

        unreadCount,

        totalNotifications: notifications.length,

        notifications,

    };

}
/*
|--------------------------------------------------------------------------
| Mark Notification As Read
|--------------------------------------------------------------------------
*/

export async function markAsRead(userId, notificationId) {

    //----------------------------------
    // Find User
    //----------------------------------

    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found.");
    }

    //----------------------------------
    // Find Notification
    //----------------------------------

    const notification = await Notification.findOne({

        _id: notificationId,

        user: user._id,

    });

    if (!notification) {
        throw new Error("Notification not found.");
    }

    //----------------------------------
    // Already Read
    //----------------------------------

    if (!notification.isRead) {

        notification.isRead = true;

        notification.readAt = new Date();

        await notification.save();

    }

    //----------------------------------
    // Success Response
    //----------------------------------

    return {

        success: true,

        message: "Notification marked as read.",

        notification,

    };

}

/*
|--------------------------------------------------------------------------
| Mark All Notifications As Read
|--------------------------------------------------------------------------
*/

export async function markAllAsRead(userId) {

    //----------------------------------
    // Find User
    //----------------------------------

    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found.");
    }

    //----------------------------------
    // Update All Notifications
    //----------------------------------

    const result = await Notification.updateMany(

        {

            user: user._id,

            isRead: false,

        },

        {

            $set: {

                isRead: true,

                readAt: new Date(),

            },

        }

    );

    //----------------------------------
    // Success Response
    //----------------------------------

    return {

        success: true,

        message: "All notifications marked as read.",

        modifiedCount: result.modifiedCount,

    };

}

/*
|--------------------------------------------------------------------------
| Delete Notification
|--------------------------------------------------------------------------
*/

export async function deleteNotification(
    userId,
    notificationId
) {

    //----------------------------------
    // Find User
    //----------------------------------

    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found.");
    }

    //----------------------------------
    // Delete Notification
    //----------------------------------

    const notification = await Notification.findOneAndDelete({

        _id: notificationId,

        user: user._id,

    });

    if (!notification) {
        throw new Error("Notification not found.");
    }

    //----------------------------------
    // Success Response
    //----------------------------------

    return {

        success: true,

        message: "Notification deleted successfully.",

    };

}

/*
|--------------------------------------------------------------------------
| Clear All Notifications
|--------------------------------------------------------------------------
*/

export async function clearAllNotifications(userId) {

    //----------------------------------
    // Find User
    //----------------------------------

    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found.");
    }

    //----------------------------------
    // Delete All Notifications
    //----------------------------------

    const result = await Notification.deleteMany({

        user: user._id,

    });

    //----------------------------------
    // Success Response
    //----------------------------------

    return {

        success: true,

        message: "All notifications cleared successfully.",

        deletedCount: result.deletedCount,

    };

}