const vision = require('@google-cloud/vision');

class GCPLandmarkSingleton {
    constructor() {
        const CONFIG = {
            credentials: {
                private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
                client_email: process.env.GCP_CLIENT_EMAIL,
            }
        };

        if (!GCPLandmarkSingleton.client) {
            GCPLandmarkSingleton.client = new vision.ImageAnnotatorClient(CONFIG);
            console.log('GCP Vision API client initialized');
        }
    }

    static getInstance() {
        if (!GCPLandmarkSingleton.instance) {
            GCPLandmarkSingleton.instance = new GCPLandmarkSingleton();
        }
        return GCPLandmarkSingleton.instance;
    }

    async detectLandmark(filePath) {
        const [result] = await GCPLandmarkSingleton.client.landmarkDetection(filePath);
        return result;
    }
}

module.exports = GCPLandmarkSingleton;
