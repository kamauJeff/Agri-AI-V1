import { useState } from 'react'
import { X, MapPin, Loader2 } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useCreateFarm } from '@/hooks/useApi'
import { KENYA_COUNTIES } from '@agriai/shared'
import { cn } from '@/lib/utils'

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function MapPicker({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) { onPick(e.latlng.lat, e.latlng.lng) },
  })
  return null
}

const STEPS = ['Details', 'Location']

export default function AddFarmModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '', county: '', subCounty: '',
    totalAreaAcres: '', latitude: -1.286, longitude: 36.82,
  })
  const [marker, setMarker] = useState<[number, number] | null>(null)
  const [error, setError] = useState('')
  const createFarm = useCreateFarm()

  function handlePick(lat: number, lon: number) {
    setMarker([lat, lon])
    setForm((f) => ({ ...f, latitude: lat, longitude: lon }))
  }

  async function handleSubmit() {
    setError('')
    if (!marker) return setError('Please pick your farm location on the map.')
    try {
      await createFarm.mutateAsync({
        name: form.name,
        county: form.county,
        subCounty: form.subCounty,
        totalAreaAcres: Number(form.totalAreaAcres),
        latitude: form.latitude,
        longitude: form.longitude,
      })
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to create farm.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-card shadow-xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Add new farm</h2>
            <div className="flex gap-2 mt-1">
              {STEPS.map((s, i) => (
                <span key={s} className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  i === step ? 'bg-brand-100 text-brand-700' : i < step ? 'bg-brand-600 text-white' : 'text-muted-foreground'
                )}>{s}</span>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Farm name</label>
                <input
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Kamau Family Farm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">County</label>
                  <select
                    className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-card"
                    value={form.county}
                    onChange={(e) => setForm({ ...form, county: e.target.value })}
                  >
                    <option value="">Select county</option>
                    {KENYA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Sub-county</label>
                  <input
                    className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g. Nakuru East"
                    value={form.subCounty}
                    onChange={(e) => setForm({ ...form, subCounty: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Total area (acres)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. 5.5"
                  value={form.totalAreaAcres}
                  onChange={(e) => setForm({ ...form, totalAreaAcres: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-brand-600" />
                Click on the map to set your farm's exact location
              </p>
              <div className="h-64 rounded-xl overflow-hidden border">
                <MapContainer
                  center={[-1.286, 36.82]}
                  zoom={7}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  <MapPicker onPick={handlePick} />
                  {marker && <Marker position={marker} />}
                </MapContainer>
              </div>
              {marker && (
                <p className="text-xs text-muted-foreground text-center">
                  📍 {marker[0].toFixed(4)}, {marker[1].toFixed(4)}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                    value={form.latitude}
                    onChange={(e) => { setForm({ ...form, latitude: Number(e.target.value) }); setMarker([Number(e.target.value), form.longitude]) }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                    value={form.longitude}
                    onChange={(e) => { setForm({ ...form, longitude: Number(e.target.value) }); setMarker([form.latitude, Number(e.target.value)]) }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/30">
          <button
            onClick={() => step === 0 ? onClose() : setStep(0)}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition"
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step === 0 ? (
            <button
              onClick={() => {
                if (!form.name || !form.county || !form.subCounty || !form.totalAreaAcres) {
                  return setError('Please fill in all fields.')
                }
                setError('')
                setStep(1)
              }}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition"
            >
              Next: Set location
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={createFarm.isPending}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition"
            >
              {createFarm.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create farm
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
