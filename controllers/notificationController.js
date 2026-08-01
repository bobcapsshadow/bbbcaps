import {
    sendNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
} from "../services/notificationService.js";

/*
|--------------------------------------------------------------------------
| Send Notification
|--------------------------------------------------------------------------
*/

export async function sendNotificationController(
    req,
    res
) {

    try {

        const {
            username,
            title,
            message,
            type,
        } = req.body;

        const result =
            await sendNotification(
                username,
                title,
                message,
                type
            );

        return res.status(201).json(result);

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

}

/*
|--------------------------------------------------------------------------
| Get Notifications
|--------------------------------------------------------------------------
*/

export async function getNotificationsController(
    req,
    res
) {

    try {

        const result =
            await getNotifications(
                req.user.id
            );

        return res.status(200).json(result);

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

}
/*
|--------------------------------------------------------------------------
| Mark Notification As Read
|--------------------------------------------------------------------------
*/

export async function markAsReadController(
    req,
    res
) {

    try {

        const { id } = req.params;

        const result =
            await markAsRead(
                req.user.id,
                id
            );

        return res.status(200).json(result);

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

}

/*
|--------------------------------------------------------------------------
| Mark All Notifications As Read
|--------------------------------------------------------------------------
*/

export async function markAllAsReadController(
    req,
    res
) {

    try {

        const result =
            await markAllAsRead(
                req.user.id
            );

        return res.status(200).json(result);

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

}

/*
|--------------------------------------------------------------------------
| Delete Notification
|--------------------------------------------------------------------------
*/

export async function deleteNotificationController(
    req,
    res
) {

    try {

        const { id } = req.params;

        const result =
            await deleteNotification(
                req.user.id,
                id
            );

        return res.status(200).json(result);

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

}

/*
|--------------------------------------------------------------------------
| Clear All Notifications
|--------------------------------------------------------------------------
*/

export async function clearAllNotificationsController(
    req,
    res
) {

    try {

        const result =
            await clearAllNotifications(
                req.user.id
            );

        return res.status(200).json(result);

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

}