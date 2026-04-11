import { prisma } from "@/lib/prisma";
import { format, differenceInDays } from "date-fns";
import { ExternalLink, Shield, ShieldOff, Globe, Settings, PlusCircle, Trash2, CreditCard, MessageCircle } from "lucide-react";
import Link from "next/link";
import { toggleClientStatus, deleteClient } from "@/lib/actions";
import { CountdownTimer } from "@/components/countdown-timer";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const clients = await prisma.client.findMany({
    where: { id: { not: "system-client" } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Portfolio</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your websites and tenant services from one place.
          </p>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{clients.filter((c: any) => c.status === "active").length} Active</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full border border-red-500/20">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>{clients.filter((c: any) => c.status === "suspended").length} Suspended</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client: any) => {
          const nextPaymentDate = new Date(client.nextPaymentDate);
          const isOverdue = new Date() > nextPaymentDate;
          const daysUntilDue = differenceInDays(nextPaymentDate, new Date());
          const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 5;
          
          let cardStyle = "glass-card rounded-2xl overflow-hidden group border border-slate-200 dark:border-slate-800 transition-all";
          if (isOverdue) cardStyle += " shadow-[0_0_15px_rgba(239,68,68,0.15)] border-red-500/30";
          else if (isDueSoon) cardStyle += " shadow-[0_0_15px_rgba(245,158,11,0.15)] border-amber-500/30";
          
          const defaultMessage = `Hi ${client.name} team,\n\nThis is a friendly reminder from your CRM regarding your active service (${client.websiteUrl}).\n\n` + 
            (isOverdue 
              ? `Your payment is currently OVERDUE by ${Math.abs(daysUntilDue)} days. Please clear your dues on the portal immediately to ensure your services remain fully active.` 
              : `Your next payment is scheduled for ${format(nextPaymentDate, "MMM d, yyyy")}.`) + 
            `\n\nThank you for choosing us!`;
            
          const whatsappUrl = `https://wa.me/${client.phoneNumber?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(defaultMessage)}`;

          return (
          <div key={client.id} className={cardStyle}>
            {/* Website Preview Placeholder */}
            <div className="aspect-video bg-slate-100 dark:bg-slate-900 relative flex items-center justify-center overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
               <img 
                 src={`https://api.microlink.io/?url=${encodeURIComponent(client.websiteUrl)}&screenshot=true&embed=screenshot.url`}
                 alt={client.name}
                 className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                 loading="lazy"
               />
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                 <Globe className="text-white scale-[2]" />
               </div>
               
               {/* Overlay with Status Badge */}
               <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider z-20 ${
                 client.status === 'active' 
                   ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                   : 'bg-red-500 text-white shadow-lg shadow-red-500/30'
               }`}>
                 {client.status}
               </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{client.name}</h3>
                  <a 
                    href={client.websiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-500 text-sm flex items-center gap-1 hover:underline"
                  >
                    {client.websiteUrl.replace('https://', '')}
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              <div className="mb-6">
                <CountdownTimer 
                  targetDate={nextPaymentDate} 
                  isOverdue={isOverdue} 
                  isDueSoon={isDueSoon} 
                />
              </div>

              <div className="flex items-center gap-2 mb-4">
                {client.phoneNumber ? (
                  <a 
                    href={whatsappUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 flex items-center justify-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white rounded-lg text-xs font-bold transition-all border border-[#25D366]/20"
                  >
                    <MessageCircle size={14} /> Send WhatsApp Reminder
                  </a>
                ) : (
                  <div className="flex-1 py-1.5 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed border border-slate-200 dark:border-slate-800">
                    <MessageCircle size={14} opacity={0.5} /> No Phone Configured
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <form action={toggleClientStatus.bind(null, client.id, client.status)} className="flex-1">
                  <button
                    className={`w-full py-2 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      client.status === 'active' 
                        ? 'bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white' 
                        : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                    }`}
                  >
                    {client.status === 'active' ? <ShieldOff size={16} /> : <Shield size={16} />}
                    {client.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                </form>
                
                <Link 
                  href={`/pay/${client.id}`}
                  className="relative z-20 p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-all text-slate-500 hover:text-emerald-500"
                  title="Client Billing Page"
                >
                  <CreditCard size={20} />
                </Link>

                <Link 
                  href={`/dashboard/clients/${client.id}`}
                  className="relative z-20 p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all text-slate-500 hover:text-indigo-500"
                  title="Client Settings"
                >
                  <Settings size={20} />
                </Link>

                <form action={deleteClient.bind(null, client.id)}>
                  <button 
                    type="submit"
                    className="relative z-20 p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-red-500 transition-all text-slate-500 hover:text-red-500"
                    title="Delete Client"
                  >
                    <Trash2 size={20} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )})}

        {clients.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center glass-card rounded-2xl border-dashed border-2">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <PlusCircle size={32} />
            </div>
            <h3 className="text-xl font-bold">No Clients Yet</h3>
            <p className="text-slate-500 max-w-xs mb-8">
              Start by adding your first client website to the dashboard.
            </p>
            <Link 
              href="/dashboard/clients/add"
              className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md"
            >
              Add New Client
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
