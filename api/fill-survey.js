import {fillSurvey} from "../helper/helper.js"

export default async function handler(req, res) {
    req.setTimeout(60000);
    res.setTimeout(60000);

    try {
        await fillSurvey("02378-13230-72825-18446-00126-4");
        console.log("Survey completed successfully");
        
        res.status(200).json({ 
            success: true, 
            message: "Survey completed successfully" 
        });
    } catch (error) {
        console.error("Survey failed:", error);
        
        res.status(500).json({ 
            success: false, 
            message: "Survey failed", 
            error: error.message 
        });
    }
}