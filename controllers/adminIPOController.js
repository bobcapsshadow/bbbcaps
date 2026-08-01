import {
    createIPO,
    updateUserIPO,
    deleteIPO,
    closeIPO,
} from "../services/adminIPOService.js";

/*
|--------------------------------------------------------------------------
| Create IPO
|--------------------------------------------------------------------------
*/
export async function create(req, res) {

    try {

        const ipo = await createIPO(
            req.body,
            req.file
        );

        res.json({
            success: true,
            message: "IPO Created Successfully.",
            ipo,
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    }

}

/*
|--------------------------------------------------------------------------
| Update User IPO
|--------------------------------------------------------------------------
*/
export async function updateUser(req, res) {

    try {

        const ipo = await updateUserIPO(req.body);

        res.json({
            success: true,
            message: "User IPO Updated Successfully.",
            ipo,
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    }

}

/*
|--------------------------------------------------------------------------
| Delete IPO
|--------------------------------------------------------------------------
*/
export async function remove(req, res) {

    try {

        await deleteIPO(req.params.id);

        res.json({
            success: true,
            message: "IPO Deleted Successfully.",
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    }

}

/*
|--------------------------------------------------------------------------
| Close IPO
|--------------------------------------------------------------------------
*/
export async function close(req, res) {

    try {

        const ipo = await closeIPO(
            req.params.id
        );

        res.json({
            success: true,
            message: "IPO Closed Successfully.",
            ipo,
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    }

}