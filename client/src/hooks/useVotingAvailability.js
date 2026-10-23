import {useEffect,useState} from "react";
import api from "../services/api";
export default function useVotingAvailability(electionId) {
    const [state,setState]=useState({id:null,available:false,paused:false,message:"Checking voting hours…"});
    useEffect(()=>{
        if(!electionId)return;
        let live=true,pending=false;
        const load=async()=>{
            if(pending || document.hidden)return;
            pending=true;
            try {
                const {data}=await api.get("/elections/"+electionId+"/voting-availability",{timeout:10000});
                if(live)setState({...data,id:electionId});
            } catch {
                if(live)setState(previous=>({
                    ...previous,id:electionId,available:false,
                    paused:previous.id===electionId && previous.paused===true,
                    message:previous.id===electionId && previous.paused
                        ? previous.message
                        : "Unable to verify voting availability. Please try again shortly."
                }));
            } finally {pending=false;}
        };
        const onStorage=event=>{if(event.key==="votara-voting-update")load();};
        load();
        const timer=setInterval(load,5000);
        window.addEventListener("focus",load);
        window.addEventListener("storage",onStorage);
        window.addEventListener("votara-platform-update",load);
        document.addEventListener("visibilitychange",load);
        return()=>{
            live=false;clearInterval(timer);window.removeEventListener("focus",load);
            window.removeEventListener("storage",onStorage);window.removeEventListener("votara-platform-update",load);
            document.removeEventListener("visibilitychange",load);
        };
    },[electionId]);
    return state.id===electionId ? state : {available:false,paused:false,message:"Checking voting hours…"};
}
