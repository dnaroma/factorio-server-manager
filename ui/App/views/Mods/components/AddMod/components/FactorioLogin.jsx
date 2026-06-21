import React, {useState} from "react";
import {useForm} from "react-hook-form";
import Input from "../../../../../components/Input";
import Label from "../../../../../components/Label";
import Button from "../../../../../components/Button";
import Checkbox from "../../../../../components/Checkbox";
import modsResource from "../../../../../../api/resources/mods";

const FactorioLogin = ({setIsFactorioAuthenticated}) => {

    const {register, handleSubmit, watch} = useForm({
        defaultValues: {
            useApiKey: false
        }
    });
    const [isLoading, setIsLoading] = useState(false);
    const useApiKey = watch('useApiKey');

    const login = ({username, password, apiKey, useApiKey}) => {
        setIsLoading(true);
        modsResource.portal.login(useApiKey ? {username, apiKey} : {username, password})
            .then(res => {
                setIsFactorioAuthenticated(true)
            })
            .catch(() => window.flash("Given Factorio credentials do not match any account.", "red"))
            .finally(() => setIsLoading(false));
    }

    return (
        <form onSubmit={handleSubmit(login)}>
            <div className="mb-4">
                <Checkbox text="Use API key" register={register('useApiKey')}/>
            </div>
            <div className="flex mb-4">
                <div className={`${useApiKey ? 'w-1/3' : 'w-1/2'} mr-2`}>
                    <Label text="Username" htmlFor="username"/>
                    <Input register={register('username',{required: true})}/>
                </div>
                {useApiKey
                    ? <div className="w-2/3 ml-2">
                        <Label text="API key" htmlFor="apiKey"/>
                        <Input type="password" register={register('apiKey',{required: useApiKey})}/>
                    </div>
                    : <div className="w-1/2 ml-2">
                        <Label text="Password" htmlFor="password"/>
                        <Input type="password" register={register('password',{required: !useApiKey})}/>
                    </div>
                }
            </div>
            <Button isSubmit={true} isLoading={isLoading}>Login</Button>
        </form>
    )
}

export default FactorioLogin;
