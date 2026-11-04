import {createContext,useCallback,useContext,useEffect,useState} from "react";
const AuthContext=createContext(null);
const KEY="fightlab_demo_token";
export function AuthProvider({children}){
 const [token,setToken]=useState(()=>sessionStorage.getItem(KEY)||"");
 const [user,setUser]=useState(null);const [loading,setLoading]=useState(Boolean(sessionStorage.getItem(KEY)));
 const logout=useCallback(()=>{sessionStorage.removeItem(KEY);setToken("");setUser(null);setLoading(false)},[]);
 const refresh=useCallback(async()=>{const t=sessionStorage.getItem(KEY);if(!t){setUser(null);setLoading(false);return null}setLoading(true);try{const r=await fetch('/api/auth/me',{headers:{Authorization:`Bearer ${t}`}});if(!r.ok)throw Error('Session expired');const d=await r.json();setUser(d.user);return d.user}catch{logout();return null}finally{setLoading(false)}},[logout]);
 useEffect(()=>{refresh()},[refresh]);
 const login=(nextToken,nextUser)=>{sessionStorage.setItem(KEY,nextToken);setToken(nextToken);setUser(nextUser)};
 return <AuthContext.Provider value={{user,token,loading,login,logout,refresh,setUser}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const ctx=useContext(AuthContext);if(!ctx)throw Error('AuthProvider is missing');return ctx}
