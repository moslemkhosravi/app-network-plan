import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Users, Mail, Phone, MoreHorizontal } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/clients")({
  head: () => ({
    meta: [
      { title: "Clients — App Network Plan" },
      { name: "description", content: "Manage network infrastructure clients." },
    ],
  }),
  component: ClientsPage,
});

type Client = {
  id: string;
  name: string;
  contact: string;
  email: string;
  status: "active" | "inactive";
  sites: number;
};

function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "" });

  // تشخیص خودکار آی‌پی سرور برای اتصال به بک‌اند پایتون
  const API_BASE_URL = typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://127.0.0.1:8000";

  // دریافت لیست مشتریان از دیتابیس
  const fetchClients = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clients/`);
      if (response.ok) {
        const data = await response.json();
        const mappedClients = data.map((c: any) => ({
          id: `CLT-${String(c.id).padStart(3, "0")}`,
          name: c.name,
          contact: c.contact_info || "—",
          email: "N/A",
          status: "active",
          sites: 0
        }));
        setClients(mappedClients);
      }
    } catch (error) {
      toast.error("خطا در اتصال به دیتابیس بک‌اند");
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  function openAdd() {
    setForm({ name: "", contact: "" });
    setOpen(true);
  }

  // ارسال مشتری جدید به بک‌اند
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.contact.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/clients/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, contact_info: form.contact })
      });

      if (response.ok) {
        toast.success("مشتری جدید با موفقیت در دیتابیس ثبت شد");
        setOpen(false);
        fetchClients(); // آپدیت لیست به صورت زنده
      } else {
        const err = await response.json();
        toast.error(err.detail || "خطا در ثبت اطلاعات");
      }
    } catch (error) {
      toast.error("خطا در ارسال درخواست به سرور");
    }
  }

  const filtered = useMemo(
    () =>
      clients.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.contact.toLowerCase().includes(query.toLowerCase()) ||
          c.id.toLowerCase().includes(query.toLowerCase())
      ),
    [clients, query]
  );

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>Network Operations</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Clients</h1>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Client
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-4 border-b border-border">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[120px] font-medium">ID</TableHead>
                <TableHead className="font-medium">Client Name</TableHead>
                <TableHead className="font-medium">Contact Info</TableHead>
                <TableHead className="font-medium">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="group">
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.id}</TableCell>
                  <TableCell><div className="font-medium">{c.name}</div></TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{c.contact}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>Register a new organization on your network.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Client Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Northwind Telecom"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Info</Label>
                <Input
                  id="contact"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  placeholder="Phone or email"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Add Client</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: "active" | "inactive" }) {
  return (
    <Badge className="bg-success/15 text-success hover:bg-success/15 border border-success/20 gap-1.5 font-medium">
      <span className="h-1.5 w-1.5 rounded-full bg-success" />
      Active
    </Badge>
  );
}
