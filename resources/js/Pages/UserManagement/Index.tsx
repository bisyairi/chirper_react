import React from "react";
import {Head, useForm} from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {columns} from "@/Pages/UserManagement/columns";
import {DataTable} from "@/Pages/UserManagement/data-table";
import {Button} from "@/Components/ui/button";

interface IndexProps {
    auth: {
        user: {
            name: string;
            email: string;
            // Add other user properties if needed
        };
    };
    users: {
        id: string;
        name: string;
        email: string;
    }[];
}

const Index: React.FC<IndexProps> = ({ auth, users }) => {

    const data = [...users]

    return (
        <AuthenticatedLayout>
            <Head title="Users" />

            <div className="max-w-screen mx-auto p-4 sm:p-6 lg:p-8">
                <DataTable columns={columns} data={data} />
            </div>
        </AuthenticatedLayout>
    );
};

export default Index;