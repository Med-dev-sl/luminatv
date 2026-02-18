
import { useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import LoginComponent from './components/LoginComponent';
import Dashboard from './components/admin/dashboard';
import AddMovies from './components/admin/movies/addMovies';
import DeleteMovies from './components/admin/movies/deleteMovies';
import EditMovies from './components/admin/movies/editMovies';
import UpdateMovies from './components/admin/movies/updateMovies';
import { supabase } from './supabaseClient';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={!session ? <LoginComponent /> : <Navigate to="/admin/dashboard" />}
          />
          <Route
            path="/admin/dashboard"
            element={session ? <Dashboard /> : <Navigate to="/" />}
          >
            <Route path="movies/add" element={<AddMovies />} />
            <Route path="movies/delete" element={<DeleteMovies />} />
            <Route path="movies/edit" element={<EditMovies />} />
            <Route path="movies/update" element={<UpdateMovies />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
