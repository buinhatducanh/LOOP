# UI Components

> **Location:** `src/components/ui/` + `src/components/admin/` | **Updated:** 2026-03-26
> **Base:** Radix UI primitives + Tailwind CSS v4 + class-variance-authority

---

## Base UI (`src/components/ui/`)

### Button
```typescript
import { Button } from "@/components/ui/button";

// Variants
<Button>Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">
  <Trash2 className="size-4" />
</Button>

// With loading
<Button disabled={isLoading}>
  <Loader2 className="size-4 animate-spin" />
  Saving...
</Button>
```

### Input
```typescript
import { Input } from "@/components/ui/input";

<Input placeholder="Enter text..." />
<Input type="email" placeholder="Email" />
<Input disabled />
<Input className="border-red-500" />  // error state
```

### Label
```typescript
import { Label } from "@/components/ui/label";

<Label htmlFor="email">Email address</Label>
<Input id="email" />
```

### Badge
```typescript
import { Badge } from "@/components/ui/badge";

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Destructive</Badge>
```

### Card
```typescript
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Dialog
```typescript
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Sheet (Slide-over)
```typescript
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent side="right">  {/* side: "top" | "bottom" | "left" | "right" */}
    <SheetHeader>
      <SheetTitle>Title</SheetTitle>
      <SheetDescription>Description</SheetDescription>
    </SheetHeader>
    Content here
  </SheetContent>
</Sheet>
```

### Table
```typescript
import {
  Table, TableBody, TableCaption, TableCell,
  TableFooter, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

<Table>
  <TableCaption>List caption</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {rows.map(row => (
      <TableRow key={row.id}>
        <TableCell>{row.name}</TableCell>
        <TableCell><Badge>{row.status}</Badge></TableCell>
        <TableCell className="text-right">{row.amount}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Select
```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

<Select onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="opt1">Option 1</SelectItem>
    <SelectItem value="opt2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### Tabs
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Overview content</TabsContent>
  <TabsContent value="settings">Settings content</TabsContent>
</Tabs>
```

### Form
```typescript
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// Works with react-hook-form + zod
// See: src/components/ui/form.tsx for full example
```

### Avatar
```typescript
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

<Avatar>
  <AvatarImage src={user.avatar} alt={user.name} />
  <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
</Avatar>
```

### Skeleton
```typescript
import { Skeleton } from "@/components/ui/skeleton";

// Loading placeholder
<div className="space-y-2">
  <Skeleton className="h-4 w-[250px]" />
  <Skeleton className="h-4 w-[200px]" />
</div>
```

### Alert
```typescript
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

<Alert>
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>This is an alert message.</AlertDescription>
</Alert>
```

### AlertDialog
```typescript
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
// Confirmation dialog for destructive actions
```

### Progress
```typescript
import { Progress } from "@/components/ui/progress";

<Progress value={66} />
```

### Slider
```typescript
import { Slider } from "@/components/ui/slider";

<Slider defaultValue={[33]} max={100} step={1} />
```

### Switch
```typescript
import { Switch } from "@/components/ui/switch";

<Switch checked={enabled} onCheckedChange={setEnabled} />
```

### Checkbox
```typescript
import { Checkbox } from "@/components/ui/checkbox";

<Checkbox checked={checked} onCheckedChange={setChecked} />
```

### RadioGroup
```typescript
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// For mutually exclusive options
```

### Tooltip
```typescript
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild><Button>?</Button></TooltipTrigger>
    <TooltipContent>Help text here</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Sonner (Toast)
```typescript
import { toast } from "sonner";

// Usage
toast.success("Saved successfully!");
toast.error("Failed to save.");
toast.warning("Are you sure?");
toast.info("New update available.");
toast("Default toast");

// With action
toast.success("Order confirmed!", {
  action: { label: "View", onClick: () => router.push("/orders") },
});
```

---

## Admin Components (`src/components/admin/`)

### AdminCrudList — Generic CRUD Table Component

> The main component for admin list pages. Handles pagination, search, create, edit, delete.

```typescript
import { AdminCrudList } from "@/components/admin/admin-crud-list";

// Props
<AdminCrudList
  title="Orders"
  description="Manage customer orders"
  apiEndpoint="/api/admin/orders"
  columns={[
    { key: "customerName", label: "Customer" },
    { key: "customerEmail", label: "Email" },
    { key: "status", label: "Status", render: (val) => <Badge>{val}</Badge> },
  ]}
  searchFields={["customerName", "customerEmail"]}
  createForm={OrderForm}
  editForm={OrderForm}
  itemName="order"
/>
```

### StatusBadge — Color-coded status display

```typescript
import { StatusBadge } from "@/components/admin/ui/status-badge";

<StatusBadge status="pending" />
<StatusBadge status="completed" />
<StatusBadge status="cancelled" />
// Auto color: pending=yellow, completed=green, cancelled=red, etc.

// STATUS_COLORS map (from admin-crud-list.tsx)
export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }>
```

### StatCard — Dashboard KPI card

```typescript
import { StatCard } from "@/components/admin/ui/stat-card";

<StatCard
  title="Total Revenue"
  value="₫125,000,000"
  description="+12% from last month"
  trend="up"
  icon={<DollarSign className="size-4" />}
/>
```

### PageHeader — Admin page header

```typescript
import { PageHeader } from "@/components/admin/ui/page-header";

<PageHeader
  title="Orders"
  description="Manage all customer orders"
  actions={<Button>Create Order</Button>}
/>
```

### EmptyState — Empty list placeholder

```typescript
import { EmptyState } from "@/components/admin/ui/empty-state";

<EmptyState
  icon={<Package className="size-12" />}
  title="No orders yet"
  description="Create your first order to get started."
  action={<Button>Create Order</Button>}
/>
```

### LoadingSkeleton — Loading state for admin pages

```typescript
import { LoadingSkeleton } from "@/components/admin/ui/loading-skeleton";

{isLoading ? <LoadingSkeleton count={5} /> : <OrderList />}
```

### ConfirmDialog — Destructive action confirmation

```typescript
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";

<ConfirmDialog
  trigger={<Button variant="destructive">Delete</Button>}
  title="Delete Order?"
  description="This action cannot be undone."
  confirmLabel="Delete"
  onConfirm={handleDelete}
/>
```

### PermissionGuard — Role/permission-based rendering

```typescript
import {
  PermissionGuard,
  AdminOnly,
  ManagerPlus,
  CanRead,
  CanCreate,
  CanUpdate,
  CanDelete,
} from "@/components/admin/PermissionGuard";

// Role-level guards
<AdminOnly>
  <AdminPanel />
</AdminOnly>

<ManagerPlus>
  <ProjectActions />
</ManagerPlus>

// Resource-level guards
<CanRead resource="orders">
  <OrderList />
</CanRead>

<CanCreate resource="orders">
  <CreateOrderButton />
</CanCreate>

<CanDelete resource="orders">
  <DeleteButton />
</CanDelete>

// Combined check
<PermissionGuard
  minRoleLevel={2}
  permissions={[{ resource: "orders", actions: ["update", "approve"] }]}
>
  <OrderActions />
</PermissionGuard>
```

### ImageUploader — Cloudinary image upload

```typescript
import { ImageUploader } from "@/components/ui/image-uploader";

<ImageUploader
  value={imageUrl}
  onChange={setImageUrl}
  folder="products"
/>
```

---

## Shared Components (`src/components/shared/`)

| Component | File | Purpose |
|-----------|------|---------|
| `Navbar` | `shared/Navbar.tsx` | Main site navigation |
| `Footer` | `shared/Footer.tsx` | Site footer |
| `HeroBanner` | `shared/HeroBanner.tsx` | Hero section banner |
| `HeroCanvas` | `shared/HeroCanvas.tsx` | Canvas animation hero |
| `LanguageSwitcher` | `shared/LanguageSwitcher.tsx` | i18n language toggle |
| `Breadcrumbs` | `shared/Breadcrumbs.tsx` | Breadcrumb navigation |
| `ImageWithFallback` | `shared/ImageWithFallback.tsx` | Image with fallback |
| `PricingCard` | `cards/PricingCard.tsx` | Pricing plan card |
| `ServiceCard` | `cards/ServiceCard.tsx` | Service card |
| `ProjectCard` | `cards/ProjectCard.tsx` | Project card |

---

## Card Components

### PricingCard
```typescript
import { PricingCard } from "@/components/cards/PricingCard";

<PricingCard
  name="Pro"
  price="2,990,000"
  period="tháng"
  features={["Feature 1", "Feature 2"]}
  popular
/>
```

### ServiceCard
```typescript
import { ServiceCard } from "@/components/cards/ServiceCard";

<ServiceCard
  icon="Globe"
  title="Website Development"
  description="..."
  href="/services/website-development"
/>
```

### ProjectCard
```typescript
import { ProjectCard } from "@/components/cards/ProjectCard";

<ProjectCard
  title="E-commerce Platform"
  category="E-commerce"
  thumbnail="/images/project-1.jpg"
  href="/portfolio/project-1"
/>
```

---

## Utility Functions

### `cn()` — Class name merging
```typescript
import { cn } from "@/lib/utils";

// Merges class names, handles conflicts
cn("px-2 py-1", "px-4", { "bg-red-500": hasError })
// → "py-1 px-4 bg-red-500"
```

---

## Icons

Uses [lucide-react](https://lucide.dev).

```typescript
import { Search, Plus, Pencil, Trash2, Eye, Check, X, Loader2 } from "lucide-react";

<Button><Plus className="size-4" /> Add New</Button>
```

---

## Color Variables (CSS)

Available via Tailwind `theme()` — use in custom styles:

```css
/* Primary brand color */
--primary
--primary-foreground

/* Backgrounds */
--background
--foreground
--card / --card-foreground
--popover / --popover-foreground
--muted / --muted-foreground
--accent / --accent-foreground

/* Status colors */
--destructive    /* Red — errors, danger */
--border
--input
--ring
```

Usage in Tailwind:
```html
<div class="bg-primary text-primary-foreground" />
<div class="bg-destructive text-white" />
```
