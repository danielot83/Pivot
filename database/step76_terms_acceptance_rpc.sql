-- =============================================================================
-- PlayPivot -- step76_terms_acceptance_rpc
-- =============================================================================
-- Revisión de seguridad de Stefano (2026-09-16), LOW-9: el registro de
-- aceptación de términos (step47, terms_acceptances) se pensó como "el
-- equivalente más cercano a un contrato firmado y fechado" -- pero la
-- policy de INSERT solo comprobaba `user_id = auth.uid()`, así que el
-- propio cliente (dashboard.html, completePendingTermsAccept()) mandaba
-- tanto terms_version como accepted_at a mano:
--
--   await supabaseClient.from("terms_acceptances").insert({
--     user_id: userId, terms_version: version, accepted_at: now
--   });
--
-- Cualquiera puede llamar a esto mismo desde la consola con OTRO valor de
-- accepted_at (fechar hacia atrás su propia aceptación) -- solo afecta a
-- su propia fila, no a la de nadie más, así que es de gravedad baja, pero
-- para un registro que se supone que hace de "prueba firmada" conviene
-- que la fecha la ponga el servidor, no quien firma.
--
-- Arreglo: una función RPC (SECURITY DEFINER) hace las dos escrituras
-- (terms_acceptances + el resumen en profiles.terms_accepted_at, igual
-- que hacía dashboard.html en dos pasos) y es ella la que decide
-- accepted_at con now() del propio servidor -- el valor que mande el
-- cliente para eso ya no se usa para nada. terms_version se sigue
-- aceptando tal cual lo manda el cliente (viene de TERMS_VERSION en
-- terms-version.js, una constante, no algo que la persona escriba) --
-- fijarlo también en el servidor duplicaría esa constante en dos sitios
-- que habría que mantener sincronizados cada vez que cambien los
-- términos, y el riesgo de que alguien mienta sobre SU PROPIA versión
-- aceptada es menor que el de backdatear la fecha.
--
-- Seguro de correr más de una vez.
-- =============================================================================

create or replace function public.record_terms_acceptance(p_version text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_now timestamptz := now();
begin
  if p_version is null or length(trim(p_version)) = 0 then
    raise exception 'p_version is required';
  end if;

  insert into public.terms_acceptances (user_id, terms_version, accepted_at)
  values (auth.uid(), p_version, v_now);

  update public.profiles set terms_accepted_at = v_now where id = auth.uid();
end $$;

grant execute on function public.record_terms_acceptance(text) to authenticated;

-- Ya no hace falta que el cliente pueda insertar directamente -- todo pasa
-- por la función de arriba, que decide la fecha ella misma.
drop policy if exists "chacun peut enregistrer sa propre acceptation" on public.terms_acceptances;
revoke insert on public.terms_acceptances from authenticated;

-- -----------------------------------------------------------------------------
-- Importante -- cerrar el agujero que dejaba abierto step75.
-- -----------------------------------------------------------------------------
-- step75_security_hardening.sql (CRITICAL-1) le dio a `authenticated` permiso
-- para escribir profiles.terms_accepted_at directamente, porque en ese momento
-- dashboard.html todavía lo escribía así (dos pasos, a mano). Con esta función
-- ya no hace falta -- el propio RPC (SECURITY DEFINER) es quien pone esa
-- fecha. Si dejáramos el grant de step75 tal cual, cualquiera podría seguir
-- haciendo:
--
--   supabaseClient.from("profiles").update({ terms_accepted_at: "2020-01-01" })
--
-- ...directamente desde la consola, sin pasar por record_terms_acceptance(),
-- y volveríamos a poder fechar hacia atrás -- exactamente el mismo problema
-- que este fichero pretende arreglar (LOW-9), solo que por la puerta de al
-- lado. Por eso hace falta quitar ese permiso ahora que ya no se necesita.
-- -----------------------------------------------------------------------------
revoke update (terms_accepted_at) on public.profiles from authenticated;
