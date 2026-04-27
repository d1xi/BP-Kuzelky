import { MemoryRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import { useEffect } from 'react';
import { useDatabase } from './database/database';
import HomePage from './home/HomePage';
import ResultsPage from './results/ResultsPage';
import TeamsPage from './teams/TeamsPage';
import CalibrationPage from './calibration/CalibrationPage';
import LeaguesPage from './leagues/LeaguesPage';

export function Navigation(){
  const navigate = useNavigate();
  useEffect(()=>{
    window.electron.ipcRenderer.on("navigate", (path)=>{
      navigate(path as string)
    })
    return ()=>{
      window.electron.ipcRenderer.removeAllListeners("navigate")
    }
  }, [])
  return null;
}

export default function App() {
  const database = useDatabase();

  async function test() {
    const teams2 = await database.teams.getAll();
    console.log(teams2); 
    
    const members2 = await database.members.getAll();
    console.log(members2); 

    //const member1 = await database.members.addMember("Jan Novak", 22242, teams2[0]);
    ///console.log(member1);

    
  }

  test();

  return (
    <Router>
      <Navigation/>
      <Routes>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/Results" element={<ResultsPage/>}/>
        <Route path="/Teams" element={<TeamsPage/>}/>
        <Route path="/Leagues" element={<LeaguesPage/>}/>
        <Route path="/Statistics" element={<h1>Statistics</h1>}/>
        <Route path="/Calibration" element={<CalibrationPage/>}/>
        <Route path="/Account" element={<h1>Acounts</h1>}/>
        <Route path="/Settings" element={<h1>Settings</h1>}/>
      </Routes>
    </Router>
  );

}
