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
            ? `/uploads/ipo/${file.filename}`
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