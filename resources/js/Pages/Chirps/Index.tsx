import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Chirp from '@/Components/Chirp';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { useForm, Head } from '@inertiajs/react';

interface ChirpData {
    id: number;
    message: string;
}

interface IndexProps {
    auth: {
        user: {
            name: string;
            email: string;
            // Add other user properties if needed
        };
    };
    chirps: ChirpData[];
}

const Index: React.FC<IndexProps> = ({ auth, chirps }) => {
    const { data, setData, post, processing, reset, errors } = useForm({
        message: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('chirps.store'), { onSuccess: () => reset() });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Chirps" />

            <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
                <form onSubmit={submit}>
                    <textarea
                        value={data.message}
                        placeholder="What's on your mind?"
                        className="block w-full border-gray-300 focus:border-indigo-300 focus:ring-3 focus:ring-indigo-200 focus:ring-opacity-50 rounded-md shadow-xs"
                        onChange={e => setData('message', e.target.value)}
                    ></textarea>
                    <InputError message={errors.message} className="mt-2"/>
                    <PrimaryButton className="mt-4" disabled={processing}>Chirp</PrimaryButton>
                </form>
                <div className="mt-6 bg-white shadow-xs rounded-lg divide-y">
                    {chirps.map(chirp =>
                        <Chirp key={chirp.id} chirp={chirp}/>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Index;