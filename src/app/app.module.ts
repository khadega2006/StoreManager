import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { App } from './app';
import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { authInterceptor } from './interceptors/auth.interceptor';

@NgModule({
  declarations: [App],
  imports: [
    BrowserModule,
    AppRoutingModule,
    Navbar,
    Footer
  ],
  providers: [provideHttpClient(withInterceptors([authInterceptor]))],
  bootstrap: [App]
})
export class AppModule {}
