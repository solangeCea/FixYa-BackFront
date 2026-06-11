import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">

      <h1 className="text-6xl font-bold text-blue-600 mb-4">
        404
      </h1>

      <p className="text-gray-600 text-lg mb-6">
        Página no encontrada
      </p>

      <Link
        to="/"
        className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
      >
        Volver al inicio
      </Link>

    </div>
  );
}

export default NotFound;