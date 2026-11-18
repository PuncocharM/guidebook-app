import type {RootCragAPI} from "../api/vs.ts";
import {MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents} from "react-leaflet";
import {url_to_id, usePersistentState} from "../utils.ts";
import {NavLink} from "react-router";
import {Histogram} from "./CragIndex.tsx";
import L, {LatLng, LatLngBounds} from 'leaflet'
import "leaflet/dist/leaflet.css"
import "../styles/cragMap.scss"

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import React, {useEffect, useRef} from "react";
import {NBSpace} from "./utilComponents.tsx";

L.Marker.prototype.options.icon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 40],
    popupAnchor: [0, -40],
});


function CustomMapControl({setZoom, setCenter}: { setZoom: (x: number) => void, setCenter: (x: LatLng) => void }) {

    const mapEvents = useMapEvents({
        zoomend: () => setZoom(mapEvents.getZoom()),
        moveend: () => setCenter(mapEvents.getCenter())
    })

    return null;
}

function FitBoundsControl({crags, fitBoundsRef, fitBoundsOnLoad}: {
    crags: RootCragAPI[],
    fitBoundsRef: React.RefObject<(() => void) | null>,
    fitBoundsOnLoad: boolean
}) {
    const map = useMap();

    const _fitBounds = () => {
        if (crags.length == 0) {
            return;
        } else {
            const latitudes = crags.map(c => c.latitude)
            const longitudes = crags.map(c => c.longitude)
            const corner1 = new LatLng(Math.min(...latitudes), Math.min(...longitudes))
            const corner2 = new LatLng(Math.max(...latitudes), Math.max(...longitudes))
            map.fitBounds(new LatLngBounds(corner1, corner2))
        }
    }

    useEffect(() => {
        fitBoundsRef.current = _fitBounds
        if (fitBoundsOnLoad) {
            _fitBounds()
        }
    }, [])

    return null;
}


const DEFAULT_ZOOM = 13;
const DEFAULT_LAT = 46.0681789;
const DEFAULT_LON = 11.1223475;
const DEFAULT_LT_LN = new LatLng(DEFAULT_LAT, DEFAULT_LON);

function CragMap({crags, guidebookId}: { crags: RootCragAPI[], guidebookId: string }) {
    const [zoom, setZoom] = usePersistentState<number>(`map-zoom-${guidebookId}`, DEFAULT_ZOOM)
    const [center, setCenter] = usePersistentState<LatLng>(`map-center-${guidebookId}`, DEFAULT_LT_LN)
    const fitBoundsRef = useRef<(() => void) | null>(null)
    const firstTime = zoom == DEFAULT_ZOOM && center == DEFAULT_LT_LN

    console.log("firstTime", firstTime)

    const handleClickResetView = () => {
        fitBoundsRef.current!()
    }


    return (
        <MapContainer style={{height: "400px"}} center={center} zoom={zoom} scrollWheelZoom={true}>
            <CustomMapControl setZoom={setZoom} setCenter={setCenter}/>
            <FitBoundsControl crags={crags} fitBoundsRef={fitBoundsRef} fitBoundsOnLoad={firstTime} />
            <button type="button"
                    className="btn btn-light btn-outline-dark btn-sm"
                    style={{zIndex: 1000, position: "absolute", top: 10, right: 10}}
                    onClick={handleClickResetView}
            ><i className="bi bi-x-circle"></i><NBSpace/>Reset view</button>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
            {crags.map(c =>
                <Marker title={c.name} position={[c.latitude, c.longitude]}>
                    {/*<Tooltip direction="right" offset={[12, -20]} opacity={1} permanent>{c.name}</Tooltip>*/}
                    <Popup>
                        <div className="text-center">
                            <div><NavLink to={`/crag/${url_to_id(c.url)}`}>{c.name}</NavLink></div>
                            <div>{c.expositions.join(", ")} | {c.altitude}m | {c.approach_time} min</div>
                            <div><Histogram histogram={c.histogram}/></div>
                        </div>
                    </Popup>
                </Marker>)}
        </MapContainer>);
}

export default CragMap