import {useEffect,useState} from "react";
import api from "../services/api";

export default function useVotingAvailability(electionId) {
    const [state,setState]=useState({id:null,available:false,message:"Checking voting hours…"});
    useEffect(()=>{
        if(!electionId) return;
        let live=true, pending=false;
        const load=async()=>{
            if(pending) return;
            pending=true;
            try {
                const {data}=await api.get("/elections/"+electionId+"/voting-availability",{timeout:10000});
                if(live) setState({...data,id:electionId});
            } catch {
                if(live) setState({id:electionId,available:false,message:"Unable to verify voting hours. Please try again shortly."});
            } finally {pending=false;}
        };
        load();
        const timer=setInterval(load,15000);
        window.addEventListener("focus",load);
        document.addEventListener("visibilitychange",load);
        return()=>{live=false;clearInterval(timer);window.removeEventListener("focus",load);document.removeEventListener("visibilitychange",load);};
    },[electionId]);
    return state.id===electionId ? state : {available:false,message:"Checking voting hours…"};
}
