import { Component, type ErrorInfo, type ReactNode } from "react";
export class ErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(error:Error,_info:ErrorInfo){console.error("CareBridge interface error:",error.name);}
 render(){if(this.state.failed)return <main role="alert" className="mx-auto max-w-xl p-8"><h1 className="text-2xl font-bold">CareBridge could not display this view</h1><p className="mt-3">Reload the application to retry. Stored demo records have not been cleared.</p><button className="mt-4 rounded-lg bg-navy px-4 py-2 text-white" onClick={()=>location.reload()}>Reload application</button></main>;return this.props.children;}
}
