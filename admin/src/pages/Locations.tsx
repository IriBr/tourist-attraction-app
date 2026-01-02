import { useEffect, useState } from 'react';
import {
  Globe,
  MapPin,
  Building2,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react';
import { locationsApi } from '../api/locations';
import type { Continent, Country, City } from '../api/locations';

type ViewMode = 'hierarchy' | 'continents' | 'countries' | 'cities';
type EditMode = 'continent' | 'country' | 'city' | null;

export function LocationsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy');
  const [hierarchy, setHierarchy] = useState<Continent[]>([]);
  const [continents, setContinents] = useState<Continent[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedContinents, setExpandedContinents] = useState<Set<string>>(new Set());
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());

  // Filters
  const [selectedContinent, setSelectedContinent] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  // Modal state
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [viewMode, selectedContinent, selectedCountry]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (viewMode === 'hierarchy') {
        const data = await locationsApi.getFullHierarchy();
        setHierarchy(data);
      } else if (viewMode === 'continents') {
        const data = await locationsApi.getContinents();
        setContinents(data);
      } else if (viewMode === 'countries') {
        const data = await locationsApi.getCountries(selectedContinent || undefined);
        setCountries(data);
      } else if (viewMode === 'cities') {
        const data = await locationsApi.getCities(selectedCountry || undefined);
        setCities(data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleContinent = (id: string) => {
    const newExpanded = new Set(expandedContinents);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedContinents(newExpanded);
  };

  const toggleCountry = (id: string) => {
    const newExpanded = new Set(expandedCountries);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCountries(newExpanded);
  };

  const handleDelete = async (type: 'continent' | 'country' | 'city', id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all nested items.`)) {
      return;
    }

    try {
      if (type === 'continent') {
        await locationsApi.deleteContinent(id);
      } else if (type === 'country') {
        await locationsApi.deleteCountry(id);
      } else {
        await locationsApi.deleteCity(id);
      }
      fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const openCreateModal = (type: EditMode, parentId?: string) => {
    setEditMode(type);
    setEditingItem({ parentId });
  };

  const openEditModal = (type: EditMode, item: any) => {
    setEditMode(type);
    setEditingItem(item);
  };

  const closeModal = () => {
    setEditMode(null);
    setEditingItem(null);
  };

  const handleSave = async (data: any) => {
    try {
      if (editMode === 'continent') {
        if (editingItem?.id) {
          await locationsApi.updateContinent(editingItem.id, data);
        } else {
          await locationsApi.createContinent(data);
        }
      } else if (editMode === 'country') {
        if (editingItem?.id) {
          await locationsApi.updateCountry(editingItem.id, data);
        } else {
          await locationsApi.createCountry({ ...data, continentId: editingItem?.parentId });
        }
      } else if (editMode === 'city') {
        if (editingItem?.id) {
          await locationsApi.updateCity(editingItem.id, data);
        } else {
          await locationsApi.createCity({ ...data, countryId: editingItem?.parentId });
        }
      }
      closeModal();
      fetchData();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Location Management</h1>
        <div className="flex items-center gap-2">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="hierarchy">Hierarchy View</option>
            <option value="continents">Continents</option>
            <option value="countries">Countries</option>
            <option value="cities">Cities</option>
          </select>
          {viewMode === 'continents' && (
            <button
              onClick={() => openCreateModal('continent')}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
            >
              <Plus size={20} />
              Add Continent
            </button>
          )}
        </div>
      </div>

      {/* Filters for countries and cities */}
      {viewMode === 'countries' && (
        <div className="mb-4 flex items-center gap-4">
          <select
            value={selectedContinent}
            onChange={(e) => setSelectedContinent(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">All Continents</option>
            {continents.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => openCreateModal('country')}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            <Plus size={20} />
            Add Country
          </button>
        </div>
      )}

      {viewMode === 'cities' && (
        <div className="mb-4 flex items-center gap-4">
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">All Countries</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => openCreateModal('city')}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            <Plus size={20} />
            Add City
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
      ) : viewMode === 'hierarchy' ? (
        <HierarchyView
          hierarchy={hierarchy}
          expandedContinents={expandedContinents}
          expandedCountries={expandedCountries}
          toggleContinent={toggleContinent}
          toggleCountry={toggleCountry}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onAddCountry={(continentId) => openCreateModal('country', continentId)}
          onAddCity={(countryId) => openCreateModal('city', countryId)}
        />
      ) : viewMode === 'continents' ? (
        <ContinentsList
          continents={continents}
          onEdit={(c) => openEditModal('continent', c)}
          onDelete={(id, name) => handleDelete('continent', id, name)}
        />
      ) : viewMode === 'countries' ? (
        <CountriesList
          countries={countries}
          onEdit={(c) => openEditModal('country', c)}
          onDelete={(id, name) => handleDelete('country', id, name)}
        />
      ) : (
        <CitiesList
          cities={cities}
          onEdit={(c) => openEditModal('city', c)}
          onDelete={(id, name) => handleDelete('city', id, name)}
        />
      )}

      {/* Edit/Create Modal */}
      {editMode && (
        <EditModal
          type={editMode}
          item={editingItem}
          continents={continents}
          countries={countries}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function HierarchyView({
  hierarchy,
  expandedContinents,
  expandedCountries,
  toggleContinent,
  toggleCountry,
  onEdit,
  onDelete,
  onAddCountry,
  onAddCity,
}: {
  hierarchy: Continent[];
  expandedContinents: Set<string>;
  expandedCountries: Set<string>;
  toggleContinent: (id: string) => void;
  toggleCountry: (id: string) => void;
  onEdit: (type: EditMode, item: any) => void;
  onDelete: (type: 'continent' | 'country' | 'city', id: string, name: string) => void;
  onAddCountry: (continentId: string) => void;
  onAddCity: (countryId: string) => void;
}) {
  if (hierarchy.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">No locations yet. Start by adding a continent.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {hierarchy.map((continent) => (
        <div key={continent.id} className="border-b border-gray-100 last:border-0">
          {/* Continent Row */}
          <div className="flex items-center p-4 hover:bg-gray-50">
            <button
              onClick={() => toggleContinent(continent.id)}
              className="p-1 hover:bg-gray-200 rounded mr-2"
            >
              {expandedContinents.has(continent.id) ? (
                <ChevronDown size={20} className="text-gray-500" />
              ) : (
                <ChevronRight size={20} className="text-gray-500" />
              )}
            </button>
            <Globe className="w-5 h-5 text-purple-500 mr-3" />
            <div className="flex-1">
              <span className="font-medium text-gray-900">{continent.name}</span>
              <span className="text-gray-400 ml-2 text-sm">({continent.code})</span>
              <span className="text-gray-400 ml-4 text-xs">
                {continent._count?.countries || 0} countries
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAddCountry(continent.id)}
                className="p-2 text-green-500 hover:bg-green-50 rounded-lg"
                title="Add Country"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => onEdit('continent', continent)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => onDelete('continent', continent.id, continent.name)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Countries */}
          {expandedContinents.has(continent.id) && continent.countries && (
            <div className="bg-gray-50 pl-10">
              {continent.countries.map((country) => (
                <div key={country.id}>
                  {/* Country Row */}
                  <div className="flex items-center p-3 hover:bg-gray-100 border-t border-gray-100">
                    <button
                      onClick={() => toggleCountry(country.id)}
                      className="p-1 hover:bg-gray-200 rounded mr-2"
                    >
                      {expandedCountries.has(country.id) ? (
                        <ChevronDown size={18} className="text-gray-500" />
                      ) : (
                        <ChevronRight size={18} className="text-gray-500" />
                      )}
                    </button>
                    <MapPin className="w-4 h-4 text-blue-500 mr-3" />
                    <div className="flex-1">
                      <span className="text-gray-900">{country.name}</span>
                      <span className="text-gray-400 ml-2 text-sm">({country.code})</span>
                      <span className="text-gray-400 ml-4 text-xs">
                        {country._count?.cities || 0} cities
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onAddCity(country.id)}
                        className="p-1.5 text-green-500 hover:bg-green-50 rounded"
                        title="Add City"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        onClick={() => onEdit('country', country)}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onDelete('country', country.id, country.name)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Cities */}
                  {expandedCountries.has(country.id) && country.cities && (
                    <div className="bg-white pl-10">
                      {country.cities.map((city) => (
                        <div
                          key={city.id}
                          className="flex items-center p-2.5 hover:bg-gray-50 border-t border-gray-100"
                        >
                          <Building2 className="w-4 h-4 text-green-500 mr-3 ml-6" />
                          <div className="flex-1">
                            <span className="text-gray-800 text-sm">{city.name}</span>
                            <span className="text-gray-400 ml-4 text-xs">
                              {city._count?.attractions || 0} attractions
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onEdit('city', city)}
                              className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => onDelete('city', city.id, city.name)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {country.cities.length === 0 && (
                        <div className="p-3 text-gray-400 text-sm text-center">
                          No cities yet
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {continent.countries.length === 0 && (
                <div className="p-4 text-gray-400 text-sm text-center">
                  No countries yet
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ContinentsList({
  continents,
  onEdit,
  onDelete,
}: {
  continents: Continent[];
  onEdit: (c: Continent) => void;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
              Continent
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
              Code
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
              Countries
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {continents.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-purple-500" />
                  <span className="font-medium text-gray-900">{c.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-gray-500">{c.code}</td>
              <td className="px-6 py-4 text-gray-500">{c._count?.countries || 0}</td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(c)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(c.id, c.name)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CountriesList({
  countries,
  onEdit,
  onDelete,
}: {
  countries: Country[];
  onEdit: (c: Country) => void;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
              Country
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
              Code
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
              Continent
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
              Cities
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {countries.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-gray-900">{c.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-gray-500">{c.code}</td>
              <td className="px-6 py-4 text-gray-500">{c.continent?.name || '-'}</td>
              <td className="px-6 py-4 text-gray-500">{c._count?.cities || 0}</td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(c)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(c.id, c.name)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CitiesList({
  cities,
  onEdit,
  onDelete,
}: {
  cities: City[];
  onEdit: (c: City) => void;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
              City
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
              Country
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
              Continent
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
              Attractions
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {cities.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-gray-900">{c.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-gray-500">{c.country?.name || '-'}</td>
              <td className="px-6 py-4 text-gray-500">{c.country?.continent?.name || '-'}</td>
              <td className="px-6 py-4 text-gray-500">{c._count?.attractions || 0}</td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(c)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(c.id, c.name)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EditModal({
  type,
  item,
  continents,
  countries,
  onClose,
  onSave,
}: {
  type: EditMode;
  item: any;
  continents: Continent[];
  countries: Country[];
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const isEditing = item?.id;
  const [formData, setFormData] = useState({
    name: item?.name || '',
    code: item?.code || '',
    imageUrl: item?.imageUrl || '',
    flagUrl: item?.flagUrl || '',
    continentId: item?.continentId || item?.parentId || '',
    countryId: item?.countryId || item?.parentId || '',
    latitude: item?.latitude || '',
    longitude: item?.longitude || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data: any = { name: formData.name };

    if (type === 'continent') {
      data.code = formData.code;
      if (formData.imageUrl) data.imageUrl = formData.imageUrl;
    } else if (type === 'country') {
      data.code = formData.code;
      if (formData.continentId) data.continentId = formData.continentId;
      if (formData.imageUrl) data.imageUrl = formData.imageUrl;
      if (formData.flagUrl) data.flagUrl = formData.flagUrl;
    } else if (type === 'city') {
      if (formData.countryId) data.countryId = formData.countryId;
      if (formData.imageUrl) data.imageUrl = formData.imageUrl;
      if (formData.latitude) data.latitude = parseFloat(formData.latitude);
      if (formData.longitude) data.longitude = parseFloat(formData.longitude);
    }

    await onSave(data);
    setLoading(false);
  };

  const titles = {
    continent: isEditing ? 'Edit Continent' : 'Add Continent',
    country: isEditing ? 'Edit Country' : 'Add Country',
    city: isEditing ? 'Edit City' : 'Add City',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{titles[type!]}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>

          {(type === 'continent' || type === 'country') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code {type === 'continent' ? '(e.g., EU, NA)' : '(e.g., US, FR)'}
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                maxLength={type === 'continent' ? 2 : 2}
                required
              />
            </div>
          )}

          {type === 'country' && !isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Continent</label>
              <select
                value={formData.continentId}
                onChange={(e) => setFormData({ ...formData, continentId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              >
                <option value="">Select Continent</option>
                {continents.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {type === 'city' && !isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <select
                value={formData.countryId}
                onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              >
                <option value="">Select Country</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="https://..."
            />
          </div>

          {type === 'country' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Flag URL</label>
              <input
                type="url"
                value={formData.flagUrl}
                onChange={(e) => setFormData({ ...formData, flagUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="https://..."
              />
            </div>
          )}

          {type === 'city' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
