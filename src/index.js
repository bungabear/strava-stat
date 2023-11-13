const { resolve } = require('path')
const fs = require('fs');
const StravaConfig = require('./config');
const strava = require('strava-v3')

async function getAccessToken(refreshToken) {
    try{
        const res = await strava.oauth.refreshToken(refreshToken);
        if(res?.access_token != null){
            return res.access_token;
        }
    }
    catch(e){
        console.error(e);
    }
    throw new Error("Fail to get access token");
}

async function getMyAthleteId({accessToken}) {
    try{
        let profile = await strava.athlete.get({'access_token': accessToken});
        if(profile?.id != null){
            return profile.id;
        }
    }
    catch(e){
        console.error(e);
    }
    throw new Error("Fail to get athlete id");
}

async function getAthleteStats({accessToken, id}) {
    try{
        let res = await strava.athletes.stats({'access_token': accessToken, 'id': id});
        if(res != null){
            return res;
        }
    }
    catch(e){
        console.error(e);
    }
    throw new Error("Fail to get athlete stats");
}

async function saveToSvg({id, data, fileName}) {
    fs.writeFileSync(fileName, createInfoSvg({id, data}));
}

function createInfoSvg({id, data}) {
    let totalRide = data.all_ride_totals;
    let totalRideDistanceM = totalRide.distance;
    let totalRideDistanceKM = Math.floor(totalRideDistanceM / 1000);
    let totalRideTimeS = totalRide.moving_time;
    let totalRideTimeH = Math.floor(totalRideTimeS / 60 / 60);
    let yearRide = data.ytd_ride_totals;
    let thisYearRideDistanceM = yearRide.distance;
    let thisYearRideDistanceKM = Math.floor(thisYearRideDistanceM / 1000);
    let thisYearRideTimeS = yearRide.moving_time;
    let thisYearRideTimeH = Math.floor(thisYearRideTimeS / 60 / 60);
    let stravaLogo = readStravaLogo();
    let svgText = `
    <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 150 150" preserveAspectRatio="xMidYMid meet"
        style="width: 100%; height: 100%;"
    >
        <style>
            foreignObject {
                opacity: 0;
                animation: 1s opacity forwards ease-in-out;
            }
            @keyframes opacity {
                from {
                    opacity: 0
                }
                to {
                    opacity: 1
                }
            }
            @media (prefers-color-scheme: dark) {
                foreignObject span {
                    color: white
                } 
            }
            .title {
                font-size: 16px;
            }
            
            .sub-title {
                font-size: 12px;
            }
            
            .value {
                font-size: 10px;
            }
        </style>
        <foreignObject style="width: 100%; height: 100%;">
            <html xmlns="http://www.w3.org/1999/xhtml">
            <a href="https://www.strava.com/athletes/${id}" style="text-decoration: none; color: unset;" target="_blank">
                <div style="width: 100%; height: 100%; display: flex; flex-direction:column; justify-content: center; align-items:start;">
                    <span class="title">
                        My Bike Riding
                    </span>
                    <div style="height: 10px"/>
                    <span class="sub-title">
                        Total
                    </span>
                    <span class="value">${totalRideDistanceKM.toLocaleString()} km / ${totalRideTimeH.toLocaleString()} Hours</span>
                    <div style="height: 10px"/>
                    <span class="sub-title">
                        This year
                    </span>
                    <span class="value">${thisYearRideDistanceKM.toLocaleString()} km / ${thisYearRideTimeH.toLocaleString()} Hours</span>                    
                </div>
                <div style="height: 10px"/>
                <div style="width: 100%; display: flex; flex-direction:column; align-items:end;">
                    <div style="width: 100px">
                        ${stravaLogo}            
                    </div>        
                </div>
                </a>
            </html>
        </foreignObject>
    </svg>
`;
    return svgText
}

async function download({clientId, clientSecret, refreshToken, svgName = 'my-stats.svg'} = {}) {
    clientId = clientId ?? StravaConfig.clientId;
    clientSecret = clientSecret ?? StravaConfig.clientSecret;
    refreshToken = refreshToken ?? StravaConfig.refreshToken;

    if(clientId == null){
        throw new Error("clientId is null");
    }
    
    if(clientSecret == null){
        throw new Error("clientSecret is null");
    }
    
    if(refreshToken == null){
        throw new Error("refreshToken is null");
    }

    strava.config({
        "client_id"     : clientId,
        "client_secret" : clientSecret,
    })
    console.info(`get access token`);
    const accessToken = await getAccessToken(refreshToken);
    console.info(`get my atheleId`);
    let id = await getMyAthleteId({accessToken});
    console.info(`get my athele stats`);
    let myStats = await getAthleteStats({accessToken, id});
    if(myStats == null){
        console.error('my strava stats fetch error');
        return null;
    }
    console.info(`try to make svg`);
    saveToSvg({
        id,
        data: myStats,
        fileName: svgName,
    })
    console.info(`${svgName} save complete`);
}

function readStravaLogo({path = '../asset/api_logo_pwrdBy_strava_horiz_light.svg'} = {}) {
    return fs.readFileSync(resolve(__dirname, path), "utf-8");
}

module.exports = {
    download,
    saveToSvg,
    getAccessToken,
    getAthleteStats,
    getMyAthleteId,
};