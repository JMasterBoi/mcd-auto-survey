import {fillSurvey} from "../helper/helper.js"

export default async function handler(req, res) {
    console.log("Starting survey fill...");
    
    req.setTimeout(60000);
    res.setTimeout(60000);

    const { code } = req.body;
    console.log(code)


    try {
        const valCode = await fillSurvey(code);


        console.log("Survey completed successfully, valCode: '", valCode + "'");
        
        res.status(200).json({
            valCode: valCode
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