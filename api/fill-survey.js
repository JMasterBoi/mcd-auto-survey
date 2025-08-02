import {fillSurvey} from "../helper/helper.js"

export default async function handler(req, res) {
    console.log("Starting survey fill...");
    
    req.setTimeout(60000);
    res.setTimeout(60000);

    const { code } = req.body;
    console.log(code)


    try {
        const valCode = await fillSurvey(code);

        console.log("survey started")
        if (valCode) {
            console.log("Survey completed successfully, valCode: '", valCode + "'");
        }
        else {
            console.log("Survey was not completed successfully, either faulty code or other error")
        }
        console.log("survey ended")
        res.status(200).json({ 
            valCode: valCode
        });
        
    } catch (error) {
        console.error("Survey failed:", error);
        
        res.status(200);
    }
}