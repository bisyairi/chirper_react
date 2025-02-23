import {ColumnDef, ColumnFiltersState, RowData} from "@tanstack/react-table"
import {ArrowUpDown, MoreHorizontal} from "lucide-react"
import { Button } from "@/Components/ui/button"
import { Checkbox } from "@/Components/ui/checkbox"
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {router, usePage} from "@inertiajs/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/Components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/Components/ui/dialog";
import {useForm} from "@inertiajs/react";
import React, {useEffect, useState} from "react";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import {Inertia} from "@inertiajs/inertia";

export type User = {
    id: string
    name: string
    email: string
}

declare module '@tanstack/react-table' {
    //allows us to define custom properties for our columns
    interface ColumnMeta<TData extends RowData, TValue> {
        filterVariant?: 'text' | 'range' | 'select'
    }
}

export const columns: ColumnDef<User>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: "Name",
        filterFn: 'includesString',
        cell: info => info.getValue(),
    },
    {
        accessorKey: "email",
        filterFn: 'includesString',
        header: "Email",
        cell: info => info.getValue(),
        // header: ({ column }) => {
        //     return (
        //         <div className="flex cursor-pointer select-none"
        //             onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        //         >
        //             Email <ArrowUpDown className="flex-1 ml-2 h-4 w-4" />
        //         </div>
        //     )
        // },
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const { props } = usePage<{
                auth: { user: { id: number; name: string; email: string; }; },
                users: User[]
            }>();

            const [user, setUser] = useState(row.original);
            const [isOpen, setIsOpen] = useState(false);

            const { data, setData, patch, clearErrors, reset, errors } = useForm({
                name: user.name,
                email: user.email,
            });

            // Sync local user state when row.original changes
            useEffect(() => {
                setUser(row.original);
            }, [row.original]);

            // Update form data when user state changes
            useEffect(() => {
                setData({
                    name: user.name,
                    email: user.email,
                });
            }, [user]);

            const handleDelete = () => {
                router.delete(route('user-management.destroy', user.id));
            };

            const submit = (e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                patch(route('user-management.update', user.id), {
                    onSuccess: () => {
                        setIsOpen(false);
                        clearErrors();
                    },
                });
            };

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            {/*<span className="sr-only">Open menu</span>*/}
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {/*<DropdownMenuLabel>Actions</DropdownMenuLabel>*/}
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(user.email)}
                        >
                            Copy email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {/*<DropdownMenuItem>Edit user</DropdownMenuItem>*/}
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsOpen(true); } }>Edit user</DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Edit user</DialogTitle>
                                    <DialogDescription>
                                        Make changes to your profile here. Click save when you're done.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={submit}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name" className="text-right">
                                            Name
                                        </Label>
                                        <Input id="name" type="text" value={data.name}
                                               onChange={e => setData('name', e.target.value)}
                                               className="col-span-3" />
                                        <InputError message={errors.name} className="mt-2" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="email" className="text-right">
                                            Email
                                        </Label>
                                        <Input id="email" type="email" value={data.email}
                                               onChange={e => setData('email', e.target.value)}
                                               className="col-span-3" />
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <PrimaryButton>Save changes</PrimaryButton>
                                </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    Delete user
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete user account
                                        and remove user data from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]