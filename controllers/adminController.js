import { 
    getAllUsers, 
    addBalance, 
    deductBalance, 
    updateCreditScore,
    updateUserDiscount,
} from "../services/adminService.js"; 
 
/* 
========================================= 
GET ALL USERS 
========================================= 
*/ 
 
export const getAllUsersController = async (req, res) => { 
 
    try { 
 
        const users = await getAllUsers(); 
 
        return res.status(200).json({ 
 
            success: true, 
 
            users, 
 
        }); 
 
    } 
 
    catch (error) { 
 
        console.error(error); 
 
        return res.status(500).json({ 
 
            success: false, 
 
            message: error.message, 
 
        }); 
 
    } 
 
}; 
 
/* 
========================================= 
ADD BALANCE 
========================================= 
*/ 
 
export const addBalanceController = async (req, res) => { 
 
    try { 
 
        const { 
 
            userId, 
 
            amount, 
 
        } = req.body; 
 
        const result = 
            await addBalance({ 
 
                userId, 
 
                amount, 
 
            }); 
 
        return res.status(200).json({ 
 
            success: true, 
 
            message: result.message, 
 
            balance: result.balance, 
 
        }); 
 
    } 
 
    catch (error) { 
 
        console.error(error); 
 
        return res.status(400).json({ 
 
            success: false, 
 
            message: error.message, 
 
        }); 
 
    } 
 
}; 
 
/* 
========================================= 
DEDUCT BALANCE 
========================================= 
*/ 
 
export const deductBalanceController = async (req, res) => { 
 
    try { 
 
        const { 
 
            userId, 
 
            amount, 
 
        } = req.body; 
 
        const result = 
            await deductBalance({ 
 
                userId, 
 
                amount, 
 
            }); 
 
        return res.status(200).json({ 
 
            success: true, 
 
            message: result.message, 
 
            balance: result.balance, 
 
        }); 
 
    } 
 
    catch (error) { 
 
        console.error(error); 
 
        return res.status(400).json({ 
 
            success: false, 
 
            message: error.message, 
 
        }); 
 
    } 
 
}; 

/* 
========================================= 
UPDATE CREDIT SCORE 
========================================= 
*/ 
 
export const updateCreditScoreController = async (req, res) => { 
 
    try { 
 
        const { 
 
            userId, 
 
            creditScore, 
 
        } = req.body; 
 
        const result = 
            await updateCreditScore({ 
 
                userId, 
 
                creditScore, 
 
            }); 
 
        return res.status(200).json({ 
 
            success: true, 
 
            message: result.message, 
 
            creditScore: result.creditScore, 
 
        }); 
 
    } 
 
    catch (error) { 
 
        console.error(error); 
 
        return res.status(400).json({ 
 
            success: false, 
 
            message: error.message, 
 
        }); 
 
    } 
 
}; 

/* 
========================================= 
UPDATE USER DISCOUNT 
========================================= 

Admin username aur discount percentage dalega.

Example:

username: "yusuf"
discountPercent: 10

Is user ke saare stocks par 10% discount apply hoga.
*/ 
 
export const updateUserDiscountController = async (req, res) => { 
 
    try { 
 
        const { 
 
            username, 
 
            discountPercent, 
 
        } = req.body; 
 
        const result = 
            await updateUserDiscount({ 
 
                username, 
 
                discountPercent, 
 
            }); 
 
        return res.status(200).json({ 
 
            success: true, 
 
            message: result.message, 
 
            username: result.username, 
 
            discountPercent: result.discountPercent, 
 
        }); 
 
    } 
 
    catch (error) { 
 
        console.error(error); 
 
        return res.status(400).json({ 
 
            success: false, 
 
            message: error.message, 
 
        }); 
 
    } 
 
};