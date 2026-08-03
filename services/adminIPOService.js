import cloudinary from "../config/cloudinary.js";
import IPO from "../models/IPO.js";
import UserIPO from "../models/UserIPO.js";

/*
|--------------------------------------------------------------------------
| Create IPO
|--------------------------------------------------------------------------
*/
export async function createIPO(data, file) {

    const ipo = await IPO.create({

        companyName: data.companyName,

        symbol: data.symbol || "",

        logo: file
        ? file.path
        : "",

        overallSubscription: data.overallSubscription,

        openDate: data.openDate,

        closeDate: data.closeDate,

    });

    /*
    |--------------------------------------------------------------------------
    | Automatically Create User IPO Record
    |--------------------------------------------------------------------------
    */

    return ipo;

}

/*
|--------------------------------------------------------------------------
| Update User IPO
|--------------------------------------------------------------------------
*/
export async function updateUserIPO(data) {
    

    let record = await UserIPO.findOne({
        username: data.username.toLowerCase(),
        ipoId: data.ipoId,
    });
    
    if (!record) {
    
        record = new UserIPO({
    
            username: data.username.toLowerCase(),
    
            ipoId: data.ipoId,
    
            subscribed: false,
    
        });
    
    }

    record.pricePerShare = data.pricePerShare;

    record.winningQuantity = data.winningQuantity;

    record.subscriptionQuantity = data.subscriptionQuantity;

    record.amountToBePaid = data.amountToBePaid;

    record.subscribedAmount = data.subscribedAmount;

    record.unsubscribedAmount = data.unsubscribedAmount;

    await record.save();

    return record;

}

/*
|--------------------------------------------------------------------------
| Delete IPO
|--------------------------------------------------------------------------
*/
export async function deleteIPO(id) {

    const ipo = await IPO.findById(id);

    if (!ipo) {
        return;
    }

    if (
        ipo.logo &&
        ipo.logo.startsWith("https://")
    ) {

        try {

            const match = ipo.logo.match(
                /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/
            );

            if (match) {

                await cloudinary.uploader.destroy(
                    match[1]
                );

            }

        } catch (error) {

            console.error(
                "Cloudinary delete failed:",
                error.message
            );

        }

    }

    await IPO.findByIdAndDelete(id);

    await UserIPO.deleteMany({
        ipoId: id,
    });

}

/*
|--------------------------------------------------------------------------
| Close IPO
|--------------------------------------------------------------------------
*/
export async function closeIPO(id) {

    return await IPO.findByIdAndUpdate(
        id,
        {
            status: "CLOSED",
        },
        {
            new: true,
        }
    );

}
/*
|--------------------------------------------------------------------------
| Update IPO
|--------------------------------------------------------------------------
*/

export async function updateIPO(id, data, file) {

    const ipo = await IPO.findById(id);

    if (!ipo) {
        throw new Error("IPO not found.");
    }

    ipo.companyName = data.companyName;
    ipo.symbol = data.symbol || "";
    ipo.overallSubscription = data.overallSubscription;
    ipo.openDate = data.openDate;
    ipo.closeDate = data.closeDate;

    if (data.status) {

        ipo.status = String(data.status)
            .trim()
            .toUpperCase();
    
    }

    if (file) {

        if (
            ipo.logo &&
            ipo.logo.startsWith("https://")
        ) {

            try {

                const match = ipo.logo.match(
                    /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/
                );

                if (match) {
                    await cloudinary.uploader.destroy(match[1]);
                }

            } catch (err) {
                console.error(err);
            }

        }

        ipo.logo = file.path;

    }

    await ipo.save();

    return ipo;

}