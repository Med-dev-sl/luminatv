
import { useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import LoginComponent from './components/LoginComponent';
import Dashboard from './components/admin/dashboard';
import AddMovies from './components/admin/movies/addMovies';
import DeleteMovies from './components/admin/movies/deleteMovies';
import EditMovies from './components/admin/movies/editMovies';
import UpdateMovies from './components/admin/movies/updateMovies';
import AddCategory from './components/admin/category/addCategory';
import DeleteCategory from './components/admin/category/deleteCategory';
import EditCategory from './components/admin/category/editCategory';
import UpdateCategory from './components/admin/category/updateCategory';
import AddGenres from './components/admin/genres/addGenres';
import DeleteGenres from './components/admin/genres/deleteGenres';
import EditGenres from './components/admin/genres/editGenres';
import UpdateGenres from './components/admin/genres/updateGenres';
import AddUsers from './components/admin/users/addUsers';
import DeleteUsers from './components/admin/users/deleteUsers';
import EditUsers from './components/admin/users/editUsers';
import UpdateUsers from './components/admin/users/updateUsers';
import AddUserRole from './components/admin/users/userRoles/adduserRole';
import DeleteUserRole from './components/admin/users/userRoles/deleteuserRole';
import EditUserRole from './components/admin/users/userRoles/edituserRole';
import UpdateUserRole from './components/admin/users/userRoles/updateuserRole';
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
            <Route path="category/add" element={<AddCategory />} />
            <Route path="category/delete" element={<DeleteCategory />} />
            <Route path="category/edit" element={<EditCategory />} />
            <Route path="category/update" element={<UpdateCategory />} />
            <Route path="genres/add" element={<AddGenres />} />
            <Route path="genres/delete" element={<DeleteGenres />} />
            <Route path="genres/edit" element={<EditGenres />} />
            <Route path="genres/update" element={<UpdateGenres />} />
            <Route path="users/add" element={<AddUsers />} />
            <Route path="users/delete" element={<DeleteUsers />} />
            <Route path="users/edit" element={<EditUsers />} />
            <Route path="users/update" element={<UpdateUsers />} />
            <Route path="users/roles/add" element={<AddUserRole />} />
            <Route path="users/roles/delete" element={<DeleteUserRole />} />
            <Route path="users/roles/edit" element={<EditUserRole />} />
            <Route path="users/roles/update" element={<UpdateUserRole />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
