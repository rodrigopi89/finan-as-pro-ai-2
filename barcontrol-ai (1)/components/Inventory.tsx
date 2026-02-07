import React, { useState } from 'react';
import { Product, ProductCategory } from '../types';
import { GeminiService } from '../services/geminiService';
import { Plus, Search, Edit2, Wand2, Loader2, Save, Upload, X, Image as ImageIcon, AlertTriangle } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  onSaveProduct: (product: Product) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ products, onSaveProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loadingDesc, setLoadingDesc] = useState(false);

  // Form State
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    category: ProductCategory.DRINK,
    stock: 0,
    price: 0,
    name: '',
    description: '',
    image: undefined
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(p => p.stock < 5);

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsEditing(true);
  };

  const handleNew = () => {
    setCurrentProduct({
        id: Date.now().toString(),
        category: ProductCategory.SNACK,
        stock: 10,
        price: 0,
        name: '',
        description: '',
        image: undefined
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (currentProduct.name && currentProduct.price) {
      onSaveProduct(currentProduct as Product);
      setIsEditing(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!currentProduct.name) return;
    setLoadingDesc(true);
    const desc = await GeminiService.generateMarketingCopy(currentProduct.name);
    setCurrentProduct(prev => ({ ...prev, description: desc }));
    setLoadingDesc(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("A imagem deve ser menor que 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
         const img = new Image();
         img.onload = () => {
             // Resize logic to prevent localStorage quota exceeded
             const canvas = document.createElement('canvas');
             const MAX_WIDTH = 400; 
             let width = img.width;
             let height = img.height;

             if (width > MAX_WIDTH) {
                 height *= MAX_WIDTH / width;
                 width = MAX_WIDTH;
             }
             
             canvas.width = width;
             canvas.height = height;
             
             const ctx = canvas.getContext('2d');
             ctx?.drawImage(img, 0, 0, width, height);
             
             // Compress to JPEG 0.7 quality
             const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
             setCurrentProduct(prev => ({ ...prev, image: dataUrl }));
         };
         img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6">
      {/* Product List */}
      <div className={`flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col ${isEditing ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="m-4 mb-0 p-3 bg-red-50 border border-red-100 rounded-lg flex gap-3">
             <div className="mt-0.5 text-red-500 bg-red-100 p-1.5 rounded-full h-fit">
               <AlertTriangle size={16} />
             </div>
             <div className="flex-1">
               <h4 className="text-sm font-bold text-red-800">Atenção: Estoque Crítico</h4>
               <p className="text-xs text-red-600 mt-0.5 mb-2">
                 {lowStockProducts.length} itens estão com menos de 5 unidades. Clique para repor.
               </p>
               <div className="flex flex-wrap gap-2">
                 {lowStockProducts.map(p => (
                   <button 
                     key={p.id}
                     onClick={() => handleEdit(p)}
                     className="flex items-center gap-1.5 bg-white border border-red-200 text-red-800 text-[10px] font-bold px-2 py-1 rounded shadow-sm hover:bg-red-50 hover:border-red-300 transition-all"
                   >
                     {p.name}
                     <span className="bg-red-100 text-red-700 px-1 rounded-sm min-w-[1.2rem] text-center">{p.stock}</span>
                   </button>
                 ))}
               </div>
             </div>
          </div>
        )}

        <div className="p-4 border-b border-slate-100 flex justify-between items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar item..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button 
            onClick={handleNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 sticky top-0 z-10">
              <tr>
                <th className="p-4 font-medium">Nome</th>
                <th className="p-4 font-medium hidden sm:table-cell">Categoria</th>
                <th className="p-4 font-medium">Preço</th>
                <th className="p-4 font-medium text-center">Estoque</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 group">
                  <td className="p-4 font-medium text-slate-800">
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-slate-100 bg-white" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                          <ImageIcon size={16} />
                        </div>
                      )}
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-500 hidden sm:table-cell">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs">{p.category}</span>
                  </td>
                  <td className="p-4 text-slate-600">R$ {p.price.toFixed(2)}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.stock < 10 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-green-100 text-green-700'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleEdit(p)}
                      className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="w-full md:w-96 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col animate-slide-in-right p-6 overflow-y-auto">
          <h3 className="text-xl font-bold text-slate-800 mb-6">{currentProduct.id ? 'Editar Produto' : 'Novo Produto'}</h3>
          
          <div className="space-y-4">
            {/* Image Upload */}
            <div className="flex justify-center mb-2">
              <div className="relative group">
                 {currentProduct.image ? (
                   <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                     <img src={currentProduct.image} alt="Product" className="w-full h-full object-cover" />
                     <button
                       onClick={() => setCurrentProduct({...currentProduct, image: undefined})}
                       className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                     >
                       <X size={14} />
                     </button>
                   </div>
                 ) : (
                   <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors hover:border-indigo-400">
                     <Upload className="text-slate-400 mb-2" size={24} />
                     <span className="text-xs text-slate-500 font-medium">Foto do item</span>
                     <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                   </label>
                 )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Item</label>
              <input 
                type="text" 
                value={currentProduct.name}
                onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preço (R$)</label>
                <input 
                  type="number" 
                  step="0.10"
                  value={currentProduct.price}
                  onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estoque</label>
                <input 
                  type="number" 
                  value={currentProduct.stock}
                  onChange={e => setCurrentProduct({...currentProduct, stock: parseInt(e.target.value)})}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
              <select 
                value={currentProduct.category}
                onChange={e => setCurrentProduct({...currentProduct, category: e.target.value as ProductCategory})}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                {Object.values(ProductCategory).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Descrição</label>
                <button 
                  onClick={handleGenerateDescription}
                  disabled={loadingDesc || !currentProduct.name}
                  className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                >
                  {loadingDesc ? <Loader2 className="animate-spin w-3 h-3" /> : <Wand2 className="w-3 h-3" />}
                  Gerar com IA
                </button>
              </div>
              <textarea 
                rows={3}
                value={currentProduct.description}
                onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};