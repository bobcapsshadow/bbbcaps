import IPO from "../models/IPO.js";
import UserIPO from "../models/UserIPO.js";

/*
|--------------------------------------------------------------------------
| Get All Open IPOs
|--------------------------------------------------------------------------
*/
export async function getOpenIPOs(username) {
    const ipos = await IPO.find({})
    .sort({ createdAt: -1 });

    const subscribed = await UserIPO.find({
        username: username.toLowerCase(),
    }).select("ipoId");

    const subscribedIds = new Set(
        subscribed.map((x) => x.ipoId.toString())
    );

    return ipos.map((ipo) => ({
        ...ipo.toObject(),
        subscribed: subscribedIds.has(ipo._id.toString()),
    }));
}

/*
|--------------------------------------------------------------------------
| Subscribe IPO
|--------------------------------------------------------------------------
*/
export async function subscribeIPO(username, ipoId) {

    const ipo = await IPO.findById(ipoId);

    if (!ipo) {
        throw new Error("IPO not found.");
    }

    let record = await UserIPO.findOne({
        username: username.toLowerCase(),
        ipoId,
    });

    if (!record) {

        record = new UserIPO({
            username: username.toLowerCase(),
            ipoId,
            subscribed: true,
        });

    } else {

        if (record.subscribed) {
            throw new Error("Already subscribed.");
        }

        record.subscribed = true;

    }

    await record.save();

    return {
        success: true,
        message: "IPO subscribed successfully.",
    };

}

/*
|--------------------------------------------------------------------------
| Get User Subscribed IPOs
|--------------------------------------------------------------------------
*/
export async function getSubscribedIPOs(username) {

    const records = await UserIPO.find({
        username: username.toLowerCase(),
        subscribed: true,
    })
        .populate("ipoId")
        .sort({
            createdAt: -1,
        });

    return records
        .filter(record => record.ipoId)
        .map(record => ({

            id: record._id,

            ipoId: record.ipoId._id,

            companyName: record.ipoId.companyName,

            symbol: record.ipoId.symbol,

            logo: record.ipoId.logo,

            status: record.ipoId.status,

            overallSubscription: record.ipoId.overallSubscription,

            openDate: record.ipoId.openDate,

            closeDate: record.ipoId.closeDate,

            pricePerShare: record.pricePerShare,

            winningQuantity: record.winningQuantity,

            subscriptionQuantity: record.subscriptionQuantity,

            amountToBePaid: record.amountToBePaid,

            subscribedAmount: record.subscribedAmount,

            unsubscribedAmount: record.unsubscribedAmount,

        }));

}