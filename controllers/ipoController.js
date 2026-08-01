import {
    getOpenIPOs,
    subscribeIPO,
    getSubscribedIPOs,
} from "../services/ipoService.js";

/*
|--------------------------------------------------------------------------
| GET Open IPOs
|--------------------------------------------------------------------------
*/
export async function getIPOList(req, res) {

    try {

        const { username } = req.query;

        const ipos = await getOpenIPOs(username || "");

        res.json({
            success: true,
            total: ipos.length,
            ipos,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

}

/*
|--------------------------------------------------------------------------
| Subscribe IPO
|--------------------------------------------------------------------------
*/
export async function subscribe(req, res) {

    try {

        const { username, ipoId } = req.body;

        const result = await subscribeIPO(
            username,
            ipoId
        );

        res.json(result);

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    }

}

/*
|--------------------------------------------------------------------------
| GET User Subscribed IPOs
|--------------------------------------------------------------------------
*/
export async function getSubscribed(req, res) {

    try {

        const { username } = req.params;

        const ipos = await getSubscribedIPOs(
            username
        );

        res.json({
            success: true,
            total: ipos.length,
            ipos,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

}