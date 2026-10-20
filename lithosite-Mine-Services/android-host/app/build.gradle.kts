plugins {
    id("com.android.application")
    id("com.chaquo.python")
}

android {
    namespace = "com.lithosite.mineservices.host"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.lithosite.mineservices.host"
        minSdk = 24
        targetSdk = 37
        versionCode = 1
        versionName = "0.1.0"

        ndk {
            abiFilters += listOf("arm64-v8a", "x86_64")
        }
    }

    sourceSets {
        getByName("main") {
            assets.srcDirs("../../Database")
        }
    }
}

chaquopy {
    defaultConfig {
        version = "3.13"
        buildPython("py", "-3.13")

        pip {
            install("openpyxl>=3.1,<4")
        }
    }

    sourceSets {
        getByName("main") {
            setSrcDirs(listOf("../../../src"))
        }
    }
}
