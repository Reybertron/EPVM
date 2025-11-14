import React from 'react';
import CoupleForm from './components/CoupleForm';

const logoUrl = 'https://i.imgur.com/g88Zz60.png';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full mx-auto">
        <header className="text-center mb-8">
            <img src={logoUrl} alt="Logo Pastoral Familiar" className="mx-auto w-32 h-32 mb-4"/>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
                Inscrição EPVM
            </h1>
            <p className="mt-4 text-lg text-gray-600">
                Encontro de Preparação para a Vida Matrimonial - Pastoral Familiar
            </p>
        </header>
        
        <main>
             <CoupleForm />
        </main>

        <footer className="text-center mt-8 text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Pastoral Familiar. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;